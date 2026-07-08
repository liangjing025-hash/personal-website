"""
主编排器（v2 两阶段架构）
------------------------
AI 岗位匹配器的顶层入口，串联：

两阶段流程：
  Phase 1：JD 分析 → 维度提炼 + 权重分配 + JD 质量评估
  Phase 2：匹配评分 → 经历匹配 + 二信号评级 + 证据整理

交互模式：
  当 JD 质量判定为"不足"时，返回补充问题让用户补充信息，
  最多 3 轮对话，超过后强制进入匹配。

兼容旧版：
  match_legacy() 方法保留单次调用模式。
"""

import json
import sys
import os
from datetime import datetime
from typing import List

from .data_loader import load_inputs
from .prompt_builder import build_system_prompt  # 兼容旧版
from .llm_client import (
    run_phase1,
    run_phase2,
    run_matching_with_retry,  # 兼容旧版
)
from .models import (
    MatchResult,
    MatchError,
    Phase1Result,
    Phase1Dimension,
    QuestionItem,
    MatchResponse,
    DimensionResult,
)

# 最大交互轮次（JD 不足时的对话上限）
MAX_INTERACTION_ROUNDS = 3


class JobMatcher:
    """
    AI 岗位匹配器的主类（v2 两阶段架构）。

    使用示例
    --------
    >>> from matcher_backend import JobMatcher
    >>> matcher = JobMatcher(api_key="sk-xxx", model="qwen-plus")
    >>>
    >>> # 方式1：两阶段匹配（推荐）
    >>> response = matcher.match(jd_source="我们正在招聘...", resume_source="C:/path/to/resume.json")
    >>> if response.status == "complete":
    >>>     print(response.result.overall_assessment)
    >>> elif response.status == "need_more_info":
    >>>     for q in response.questions:
    >>>         print(q.question)
    >>>
    >>> # 方式2：带补充信息的匹配
    >>> response = matcher.match(
    ...     jd_source="JD内容...",
    ...     resume_source="C:/path/to/resume.json",
    ...     supplement="该岗位的汇报对象是市场总监，核心KPI是...",
    ...     round_num=2,
    ... )
    >>>
    >>> # 方式3：旧版单次匹配
    >>> result = matcher.match_legacy(jd_source="...", resume_source="...")
    """

    def __init__(
        self,
        api_key: str | None = None,
        api_base: str | None = None,
        model: str | None = None,
    ):
        """
        参数
        ----
        api_key : str | None
            LLM API 密钥。不传则从环境变量 LLM_API_KEY 读取。
        api_base : str | None
            API 端点 Base URL。
        model : str | None
            模型名称。
        """
        self.api_key = api_key
        self.api_base = api_base
        self.model = model

    # ------------------------------------------------------------------
    # 两阶段匹配（主入口）
    # ------------------------------------------------------------------

    def match(
        self,
        jd_source: str,
        resume_source: str | dict,
        supplement: str = "",
        round_num: int = 1,
        verbose: bool = False,
    ) -> MatchResponse:
        """
        执行一次完整的岗位匹配（两阶段架构）。

        参数
        ----
        jd_source : str
            JD 文本或 .txt 文件路径
        resume_source : str | dict
            简历库 JSON 文件路径 / JSON 字符串 / 已解析的 dict
        supplement : str
            用户对 JD 的补充信息（用于 JD 不足时的多轮交互）
        round_num : int
            当前交互轮次（1, 2, 3...），用于控制交互上限
        verbose : bool
            是否打印中间过程日志

        返回
        ----
        MatchResponse :
            - status="complete" → result 包含完整 MatchResult
            - status="need_more_info" → questions 包含待补充问题
            - status="error" → error 包含错误信息
        """
        # ---------- 加载数据 ----------
        try:
            jd_text, resume_json = load_inputs(jd_source, resume_source)
        except MatchError as e:
            return MatchResponse(status="error", error=str(e), round=round_num)

        # 拼接补充信息
        if supplement.strip():
            jd_text = jd_text + "\n\n【用户补充信息】\n" + supplement.strip()
            if verbose:
                print(f"[JobMatcher] 已拼接补充信息（{len(supplement)} 字符）")

        if verbose:
            print(f"[JobMatcher] 第 {round_num} 轮交互")
            print(f"  -> JD 长度: {len(jd_text)} 字符")
            print(f"  -> 简历经历条数: {len(resume_json.get('experience_library', []))}")

        # ---------- Phase 1：JD 分析 ----------
        if verbose:
            print("[JobMatcher] Phase 1：JD 分析 ...")

        start_time = datetime.now()
        try:
            phase1_result = run_phase1(
                jd_text=jd_text,
                api_key=self.api_key,
                api_base=self.api_base,
                model=self.model,
            )
            elapsed = (datetime.now() - start_time).total_seconds()
            if verbose:
                print(f"  -> Phase 1 完成，耗时 {elapsed:.1f}s")
                print(f"  -> JD 质量: {phase1_result.jd_quality}")
                print(f"  -> 提炼维度数: {len(phase1_result.dimensions)}")
                print(f"  -> 自查清单: {phase1_result.self_check}")
        except MatchError as e:
            return MatchResponse(status="error", error=f"Phase 1 失败: {e}", round=round_num)

        # ---------- JD 不足时的交互处理 ----------
        if phase1_result.is_insufficient:
            if round_num < MAX_INTERACTION_ROUNDS:
                # 返回问题，等待用户补充
                if verbose:
                    print(f"[JobMatcher] JD 不足，生成 {len(phase1_result.questions)} 个补充问题")
                return MatchResponse(
                    status="need_more_info",
                    questions=phase1_result.questions,
                    jd_quality="不足",
                    round=round_num,
                )
            else:
                # 超过最大轮次，强行进入 Phase 2
                if verbose:
                    print(f"[JobMatcher] 已交互 {round_num} 轮，JD 仍不足 → 强制进入 Phase 2（结果仅供参考）")

                # 如果 Phase 1 没有提炼出维度，用行业补全兜底
                if not phase1_result.has_dimensions:
                    phase1_result = self._fallback_dimensions(jd_text, phase1_result)

        # ---------- Phase 2：匹配评分 ----------
        if verbose:
            print("[JobMatcher] Phase 2：匹配评分 ...")

        start_time = datetime.now()
        try:
            match_result = run_phase2(
                phase1_dimensions=phase1_result.dimensions,
                jd_quality=phase1_result.jd_quality,
                resume_json=resume_json,
                api_key=self.api_key,
                api_base=self.api_base,
                model=self.model,
            )
            elapsed = (datetime.now() - start_time).total_seconds()
            if verbose:
                print(f"  -> Phase 2 完成，耗时 {elapsed:.1f}s")
                print(f"  -> 匹配维度数: {len(match_result.dimensions)}")
                print(f"  -> 总结: {match_result.overall_assessment[:80]}...")
        except MatchError as e:
            return MatchResponse(status="error", error=f"Phase 2 失败: {e}", round=round_num)

        # ---------- 如 JD 不足但强行匹配，在总结前加标注 ----------
        if phase1_result.is_insufficient and round_num >= MAX_INTERACTION_ROUNDS:
            match_result.overall_assessment = (
                "JD信息严重不足，以下匹配结果基于行业常识补全，仅供参考。"
                + match_result.overall_assessment
            )

        return MatchResponse(
            status="complete",
            result=match_result,
            jd_quality=phase1_result.jd_quality,
            round=round_num,
        )

    # ------------------------------------------------------------------
    # JD 不足时的兜底维度
    # ------------------------------------------------------------------

    def _fallback_dimensions(self, jd_text: str, phase1_result: Phase1Result) -> Phase1Result:
        """
        当 JD 极度简略（不足 + 无维度）时，尝试用极简规则提取兜底维度。
        这是最后的兜底措施，不应是常态。
        """
        # 尝试从 JD 文本中提取岗位名称关键词
        jd_stripped = jd_text.replace("\n", " ").replace("【用户补充信息】", "").strip()

        # 极简规则：如果有"负责""协助"等动词，围绕核心动作构建1-2个维度
        dimensions = []
        if len(jd_stripped) > 5:
            dimensions = [
                Phase1Dimension(
                    dimension_name="岗位核心职责胜任度",
                    weight=100,
                    jd_basis=f"JD信息严重不足（原文仅{len(jd_stripped)}字），此为基于有限信息的兜底维度",
                    extension_note="行业补全：JD信息严重不足，无法按正常流程提炼维度，使用通用兜底维度",
                )
            ]

        return Phase1Result(
            jd_quality="不足",
            overall_understanding=phase1_result.overall_understanding,
            dimensions=dimensions,
            questions=phase1_result.questions,
            self_check=phase1_result.self_check,
        )

    # ------------------------------------------------------------------
    # 便捷方法
    # ------------------------------------------------------------------

    def match_to_json(self, jd_source: str, resume_source: str | dict, supplement: str = "", round_num: int = 1) -> str:
        """
        便捷方法：执行两阶段匹配并直接返回 JSON 字符串。
        如果返回 need_more_info 状态，JSON 中包含 questions。
        """
        response = self.match(jd_source, resume_source, supplement=supplement, round_num=round_num)
        return json.dumps(response.to_dict(), ensure_ascii=False, indent=2)

    def match_to_file(
        self,
        jd_source: str,
        resume_source: str | dict,
        output_path: str,
        supplement: str = "",
        round_num: int = 1,
    ) -> str:
        """
        执行匹配并将 JSON 结果写入文件。返回写入的文件路径。
        """
        json_str = self.match_to_json(jd_source, resume_source, supplement=supplement, round_num=round_num)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(json_str)
        return output_path

    # ------------------------------------------------------------------
    # 旧版兼容
    # ------------------------------------------------------------------

    def match_legacy(
        self,
        jd_source: str,
        resume_source: str | dict,
        verbose: bool = False,
    ) -> MatchResult:
        """
        旧版兼容：单次调用匹配（不分阶段）。

        使用示例
        --------
        >>> result = matcher.match_legacy("JD文本...", "resume.json")
        >>> print(result.overall_assessment)
        """
        if verbose:
            print("[JobMatcher/Legacy] 阶段1：加载 JD 和简历数据 ...")
        jd_text, resume_json = load_inputs(jd_source, resume_source)
        if verbose:
            print(f"  -> JD 长度: {len(jd_text)} 字符")

        if verbose:
            print("[JobMatcher/Legacy] 阶段2：构建 Prompt ...")
        # messages are built inside run_matching_with_retry

        if verbose:
            print("[JobMatcher/Legacy] 阶段3：调用 LLM ...")
        start_time = datetime.now()
        result = run_matching_with_retry(
            jd_text=jd_text,
            resume_json=resume_json,
            api_key=self.api_key,
            api_base=self.api_base,
            model=self.model,
        )
        elapsed = (datetime.now() - start_time).total_seconds()
        if verbose:
            print(f"  -> 匹配完成，耗时 {elapsed:.1f}s")
            print(f"  -> JD 质量: {result.jd_quality}")
            print(f"  -> 匹配维度数: {len(result.dimensions)}")
            print(f"  -> 总结: {result.overall_assessment[:80]}...")

        return result


# ---------------------------------------------------------------------------
# 直接运行入口：用于快速测试
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("AI 岗位匹配器 v2 —— 快速自检")
    print("=" * 60)

    # 自检1：Phase 1 Prompt 能否正常加载
    from .prompt_builder import build_phase1_system_prompt, build_phase2_system_prompt
    try:
        sp1 = build_phase1_system_prompt()
        print(f"[OK] Phase 1 System Prompt 加载成功，{len(sp1)} 字符")
    except MatchError as e:
        print(f"[FAIL] Phase 1 System Prompt 加载失败: {e}")
        sys.exit(1)

    try:
        sp2 = build_phase2_system_prompt()
        print(f"[OK] Phase 2 System Prompt 加载成功，{len(sp2)} 字符")
    except MatchError as e:
        print(f"[FAIL] Phase 2 System Prompt 加载失败: {e}")
        sys.exit(1)

    # 自检2：JSON 清洗函数
    from .llm_client import clean_json_text
    test_cases = [
        ("```json\n{\"a\": 1}\n```", '{"a": 1}'),
        ("这是分析结果：\n{\"a\": 1}\n希望对你有帮助。", '{"a": 1}'),
    ]
    all_passed = True
    for raw, expected in test_cases:
        cleaned = clean_json_text(raw)
        if cleaned == expected:
            print(f"[OK] 清洗测试: {raw[:30]}... -> {cleaned[:30]}...")
        else:
            print(f"[FAIL] 清洗测试: 期望 {expected}, 得到 {cleaned}")
            all_passed = False

    if all_passed:
        print("\n所有自检通过。如需完整匹配，请通过 API 调用 JobMatcher.match()。")
    else:
        print("\n部分自检未通过，请检查代码。")
