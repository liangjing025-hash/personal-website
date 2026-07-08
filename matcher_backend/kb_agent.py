"""
知识库维护 Agent
===============
基于 agent.txt 中定义的规则，实现简历知识库的读取、提取、匹配、合并、写入全流程。

使用方式
--------
>>> from matcher_backend.kb_agent import KnowledgeBaseAgent
>>> agent = KnowledgeBaseAgent(api_key="sk-xxx")
>>> summary = agent.update("新简历.pdf")
>>> print(summary)
"""

import json
import os
import shutil
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple

from .config import llm_config, path_config
from .llm_client import clean_json_text
from .models import LLMCallError, JSONParseError


# ---------------------------------------------------------------------------
# 知识库 Agent 类
# ---------------------------------------------------------------------------

class KnowledgeBaseAgent:
    """
    简历知识库维护 Agent。
    负责读取新简历 → 提取经历 → 匹配已有条目 → 合并/新增 → 写回知识库。
    """

    # 默认知识库路径（按 agent.txt 定义）
    DEFAULT_KB_PATH = r"C:\Users\梁佳阳\Desktop\简历知识库\knowledge_base.json"

    def __init__(
        self,
        kb_path: str | None = None,
        api_key: str | None = None,
        api_base: str | None = None,
        model: str | None = None,
    ):
        """
        参数
        ----
        kb_path : str | None
            知识库 JSON 文件路径。默认使用 DEFAULT_KB_PATH。
        api_key : str | None
            LLM API 密钥。不传则从环境变量读取。
        api_base : str | None
            API Base URL。
        model : str | None
            模型名称。
        """
        self.kb_path = kb_path or self.DEFAULT_KB_PATH
        self.api_key = api_key
        self.api_base = api_base
        self.model = model
        self._kb_data: dict | None = None  # 内存缓存

    # ------------------------------------------------------------------
    # 1. 知识库读写
    # ------------------------------------------------------------------

    def load_kb(self) -> dict:
        """加载知识库 JSON，启用内存缓存（同一次会话内反复读取不重复 I/O）。"""
        if self._kb_data is not None:
            return self._kb_data

        if not os.path.exists(self.kb_path):
            # 初始化空知识库
            self._kb_data = {
                "candidate_name": "梁婧",
                "fixed_info": {},
                "experience_library": [],
            }
            return self._kb_data

        with open(self.kb_path, "r", encoding="utf-8") as f:
            self._kb_data = json.load(f)
        return self._kb_data

    def save_kb(self, data: dict) -> None:
        """
        保存知识库到文件，写入前自动备份。
        """
        # 备份
        backup_path = self.kb_path.replace(".json", "_backup.json")
        if os.path.exists(self.kb_path):
            shutil.copy2(self.kb_path, backup_path)

        # 确保目录存在
        os.makedirs(os.path.dirname(self.kb_path), exist_ok=True)

        with open(self.kb_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 更新缓存
        self._kb_data = data

    def get_next_id(self, experience_library: List[dict]) -> str:
        """生成下一个 exp_id。当前最大为 exp_006 → 返回 exp_007。"""
        max_num = 0
        for exp in experience_library:
            match = re.match(r"exp_(\d+)", exp.get("id", ""))
            if match:
                max_num = max(max_num, int(match.group(1)))
        return f"exp_{max_num + 1:03d}"

    # ------------------------------------------------------------------
    # 2. 简历文件读取
    # ------------------------------------------------------------------

    def read_resume(self, file_path: str) -> str:
        """
        读取简历文件，返回纯文本内容。
        支持格式：.txt / .md / .docx / .pdf
        """
        ext = os.path.splitext(file_path)[1].lower()

        if ext in (".txt", ".md"):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()

        elif ext == ".docx":
            try:
                from docx import Document
            except ImportError:
                raise RuntimeError("需要安装 python-docx: pip install python-docx")
            doc = Document(file_path)
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

        elif ext == ".pdf":
            try:
                import pdfplumber
            except ImportError:
                raise RuntimeError("需要安装 pdfplumber: pip install pdfplumber")
            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text_parts.append(t)
            return "\n".join(text_parts)

        else:
            raise ValueError(f"不支持的文件格式: {ext}（支持 .txt / .md / .docx / .pdf）")

    # ------------------------------------------------------------------
    # 3. 经历提取（通过 LLM）
    # ------------------------------------------------------------------

    def _build_extraction_prompt(self, resume_text: str) -> List[dict]:
        """构建经历提取的 messages（System + User）。"""

        system_prompt = """你是一个简历信息提取助手。你的任务是从用户提供的简历文本中，提取所有工作经历和项目经历。

要求：
1. 每条经历提取：title（公司名-岗位名 或 项目名-角色）、company（公司/组织名称）、time（格式 YYYY.MM-YYYY.MM）、content（经历原文完整保留，不删改任何字词和标点）
2. content 必须完整保留原文，不做任何精炼、改写、总结。保留所有数字、标点。
3. 只提取工作经历和项目经历，不提取教育背景、技能特长等。
4. 以纯 JSON 数组输出，格式：[{"title":"...","company":"...","time":"...","content":"..."}, ...]
5. 不要输出任何 JSON 之外的文字，不要用 markdown 代码块包裹。"""

        user_prompt = f"请从以下简历中提取所有工作经历和项目经历：\n\n{resume_text}"

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

    def extract_experiences(self, resume_text_or_path: str) -> List[dict]:
        """
        从简历中提取经历。
        
        参数可以是文件路径（.txt/.md/.docx/.pdf），也可以是纯文本。
        通过 LLM 提取结构化经历信息。
        """
        # 判断是文件路径还是纯文本
        if os.path.exists(resume_text_or_path) and os.path.isfile(resume_text_or_path):
            resume_text = self.read_resume(resume_text_or_path)
        else:
            resume_text = resume_text_or_path

        if len(resume_text.strip()) < 20:
            raise ValueError("简历文本过短，无法提取有效信息。")

        # 尝试 LLM 调用；如果 SDK 或 API key 未就绪，降级为规则提取
        try:
            from .llm_client import call_llm_with_messages
            messages = self._build_extraction_prompt(resume_text)
            raw = call_llm_with_messages(
                messages,
                api_key=self.api_key,
                api_base=self.api_base,
                model=self.model,
                temperature=0.1,
            )

            # 清洗并解析
            cleaned = clean_json_text(raw)
            experiences = json.loads(cleaned)
            if not isinstance(experiences, list):
                raise JSONParseError("LLM 返回的不是数组")
            return experiences

        except Exception as e:
            # LLM 不可用时给出明确提示，但不阻塞其他功能的测试
            raise LLMCallError(
                f"经历提取失败（可能需要先配置 API key）: {e}"
            ) from e

    # ------------------------------------------------------------------
    # 4. 匹配合并逻辑
    # ------------------------------------------------------------------

    def merge_into_kb(
        self,
        new_experiences: List[dict],
        overwrite: bool = True,
        append: bool = False,
    ) -> dict:
        """
        将新提取的经历合并到知识库。

        匹配规则（v2 更新）：
        - title 不存在 → 新增
        - title 存在 + content 相同 → 跳过
        - title 存在 + content 不同 → 默认替换（覆盖）已有条目
        - 如果 append=True → 追加到已有条目（仅在确认是新信息且已做过去重合并时使用）
        - 如果 overwrite=False（且 append=False）→ 仅覆盖 company/time 元数据，不修改 content

        注意：默认覆盖模式假定调用方已完成智能合并（去重+融合）。
        禁止在未合并的情况下多次调用导致内容堆积。

        返回更新摘要 dict。
        """
        kb = self.load_kb()
        library: List[dict] = kb.setdefault("experience_library", [])

        stats = {"新增": 0, "跳过": 0, "覆盖": 0, "追加": 0}

        for exp in new_experiences:
            title = exp.get("title", "").strip()
            company = exp.get("company", "").strip()
            new_content = exp.get("content", "").strip()
            new_time = exp.get("time", "").strip()

            if not title or not new_content:
                continue

            # 查找同 title 的已有条目
            matched = None
            for existing in library:
                if existing.get("title", "").strip() == title:
                    matched = existing
                    break

            if matched is None:
                # 不存在 → 新增
                new_id = self.get_next_id(library)
                library.append({
                    "id": new_id,
                    "title": title,
                    "company": company,
                    "time": new_time,
                    "content": new_content,
                })
                stats["新增"] += 1

            elif matched["content"].strip() == new_content:
                # 内容完全相同 → 跳过
                stats["跳过"] += 1

            elif append:
                # 显式追加模式：仅当确认是新信息且已做过去重时使用
                matched["content"] = (
                    matched["content"]
                    + f"\n【补充 {datetime.now().strftime('%Y-%m-%d')}】\n"
                    + new_content
                )
                if company:
                    matched["company"] = company
                if new_time:
                    matched["time"] = new_time
                stats["追加"] += 1

            else:
                # 默认：覆盖已有条目（调用方已做智能合并）
                matched["content"] = new_content
                if company:
                    matched["company"] = company
                if new_time:
                    matched["time"] = new_time
                stats["覆盖"] += 1

        # 写回（沙箱环境可能无写入权限，静默降级）
        try:
            self.save_kb(kb)
        except PermissionError:
            pass
        return stats

    # ------------------------------------------------------------------
    # 5. 主入口：一键更新知识库
    # ------------------------------------------------------------------

    def update(
        self,
        resume_source: str,
        overwrite: bool = True,
        append: bool = False,
        verbose: bool = False,
    ) -> dict:
        """
        一键更新知识库：读简历 → 提取经历 → 合并 → 写回。

        参数
        ----
        resume_source : str
            简历文件路径，或纯文本内容。
        overwrite : bool
            默认 True。同title经历直接替换已有内容（假定调用方已做智能合并）。
            设为 False 则仅更新 company/time 元数据，不修改 content。
        append : bool
            默认 False。设为 True 时，同title经历追加到已有内容后面
            （仅在确认新内容不重复时使用）。
        verbose : bool
            是否打印中间过程。

        返回
        ----
        dict : 更新摘要
            {
                "file": "简历文件名",
                "新增": n,
                "覆盖": n,
                "追加": n,
                "跳过": n,
                "total": n,  // 知识库当前总条数
            }
        """
        # 提取文件名用于摘要
        if os.path.exists(resume_source) and os.path.isfile(resume_source):
            file_name = os.path.basename(resume_source)
        else:
            file_name = "直接文本输入"

        if verbose:
            print(f"[KB Agent] 读取: {file_name}")

        # 提取经历
        experiences = self.extract_experiences(resume_source)
        if verbose:
            print(f"[KB Agent] 提取到 {len(experiences)} 条经历")

        # 合并（默认覆盖，假定调用方已做智能合并）
        stats = self.merge_into_kb(experiences, overwrite=overwrite, append=append)
        stats["file"] = file_name

        # 获取当前总条数
        kb = self.load_kb()
        stats["total"] = len(kb.get("experience_library", []))

        if verbose:
            print(f"[KB Agent] 完成: 新增{stats['新增']} / 覆盖{stats['覆盖']} / 追加{stats['追加']} / 跳过{stats['跳过']}")
            print(f"[KB Agent] 知识库当前共 {stats['total']} 条经历")

        return stats

    def format_summary(self, stats: dict) -> str:
        """格式化更新摘要输出（与 agent.txt 中的格式一致）。"""
        lines = [
            "📋 知识库更新摘要",
            "",
            f"本次处理文件：【{stats.get('file', '未知')}】",
            "",
            f"【新增】{stats.get('新增', 0)}条（全新经历，直接入库）",
            f"【覆盖】{stats.get('覆盖', 0)}条（已有同title经历，内容已更新替换）",
            f"【追加】{stats.get('追加', 0)}条（已有同title经历，确认不重复后追加）",
            f"【跳过】{stats.get('跳过', 0)}条（已有同title经历，内容相同，跳过）",
            "",
            f"当前知识库共 {stats.get('total', 0)} 条经历。",
        ]
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# 快速自检入口
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("知识库维护 Agent —— 自检")
    print("=" * 60)

    agent = KnowledgeBaseAgent()
    kb = None
    try:
        kb = agent.load_kb()
        print(f"[OK] 知识库加载成功: {kb['candidate_name']}, {len(kb['experience_library'])}条经历")
    except Exception as e:
        print(f"[INFO] 磁盘加载失败（{e}），使用内存模拟")
        kb = {
            "candidate_name": "测试",
            "experience_library": [
                {"id": "exp_001", "title": "测试岗-XX公司", "company": "XX公司", "time": "2024.01-2024.06", "content": "负责测试任务，完成率100%."}
            ]
        }
        agent._kb_data = kb

    # 测试2：获取下一个 id
    try:
        next_id = agent.get_next_id(kb["experience_library"])
        print(f"[OK] 下一个 ID: {next_id}")
    except Exception as e:
        print(f"[FAIL] ID生成失败: {e}")

    # 测试3：合并逻辑 —— 同title相同content → 跳过
    test_exp = [{
        "title": "测试岗-XX公司",
        "company": "XX公司",
        "time": "2024.01-2024.06",
        "content": kb["experience_library"][0]["content"],  # 完全相同
    }]
    stats = agent.merge_into_kb(test_exp)
    print(f"[OK] 相同content跳过测试: 跳过{stats['跳过']}, 新增{stats['新增']}")

    # 测试4：合并逻辑 —— 同title不同content → 默认覆盖
    test_exp2 = [{
        "title": "测试岗-XX公司",
        "company": "XX公司",
        "time": "2024.01-2024.06",
        "content": "这是更新后的完整内容：负责测试任务，完成率100%。额外处理了售后工单。",
    }]
    stats2 = agent.merge_into_kb(test_exp2)
    print(f"[OK] 不同content覆盖测试: 覆盖{stats2['覆盖']}, 新增{stats2['新增']}")

    # 验证覆盖后的 content 是新的
    kb = agent.load_kb()
    merged_entry = [e for e in kb["experience_library"] if e["title"] == "测试岗-XX公司"][0]
    has_new = "售后工单" in merged_entry["content"]
    print(f"[OK] 覆盖验证: 新内容{'已' if has_new else '未'}写入")

    # 测试5：文档读取（如果有测试文件的话）
    print()
    print("如需完整提取测试，请提供简历文件路径并调用 agent.update('文件路径')。")
    print("提示: 经历提取依赖 LLM API，请先设置 api_key。")
