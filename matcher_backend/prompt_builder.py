"""
Prompt 构建模块（v2 两阶段架构）
-------------------------------
Phase 1：加载 phase1_jd_analysis.txt，构建 JD 分析 messages
Phase 2：加载 phase2_matching.txt，注入 Phase 1 结果 + 简历 JSON，构建匹配评分 messages

同时保留旧版 build_messages 以兼容直接调用场景。
"""

import os
import json
from .config import path_config
from .models import PromptBuildError, Phase1Dimension


# ---------------------------------------------------------------------------
# 通用：文件缓存读取
# ---------------------------------------------------------------------------

def _load_prompt_file(file_path: str, cache_key: str = "") -> str:
    """
    读取 Prompt 模板文件，使用文件修改时间缓存。
    编辑 Prompt 文件后自动生效，无需重启服务器。
    """
    # 使用模块级缓存
    cache_attr = f"_cache_{cache_key}"
    mtime_attr = f"_mtime_{cache_key}"

    if not hasattr(_load_prompt_file, cache_attr):
        setattr(_load_prompt_file, cache_attr, None)
        setattr(_load_prompt_file, mtime_attr, None)

    if not os.path.exists(file_path):
        raise PromptBuildError(f"Prompt 模板文件不存在: {file_path}")

    current_mtime = os.path.getmtime(file_path)
    cached_mtime = getattr(_load_prompt_file, mtime_attr)
    cached_content = getattr(_load_prompt_file, cache_attr)

    if cached_mtime is not None and cached_mtime == current_mtime and cached_content is not None:
        return cached_content

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    if len(content.strip()) < 100:
        raise PromptBuildError(f"Prompt 模板内容过短，请检查 {os.path.basename(file_path)} 是否完整。")

    setattr(_load_prompt_file, mtime_attr, current_mtime)
    setattr(_load_prompt_file, cache_attr, content)
    return content


# ---------------------------------------------------------------------------
# Phase 1：JD 分析
# ---------------------------------------------------------------------------

def build_phase1_system_prompt() -> str:
    """返回 Phase 1（JD 分析）的 System Prompt。"""
    return _load_prompt_file(path_config.phase1_prompt_path, "phase1")


def build_phase1_user_prompt(jd_text: str) -> str:
    """
    构建 Phase 1 的 User Prompt，只包含 JD 文本。

    参数
    ----
    jd_text : str
        JD 描述文本

    返回
    ----
    str : User Prompt
    """
    user_prompt = f"""请对以下岗位描述（JD）进行深度分析：

## JD 文本
{jd_text}

请按照你的 System Prompt 中的六步流程，完成岗位画像、JD质量判断、能力维度提炼、权重分配、整体判断和自查，输出纯 JSON 结果。"""
    return user_prompt


def build_phase1_messages(jd_text: str) -> list[dict]:
    """
    构建 Phase 1 的完整 messages 列表。

    返回
    ----
    list[dict] : [{"role": "system", "content": ...}, {"role": "user", "content": ...}]
    """
    return [
        {"role": "system", "content": build_phase1_system_prompt()},
        {"role": "user", "content": build_phase1_user_prompt(jd_text)},
    ]


# ---------------------------------------------------------------------------
# Phase 2：匹配评分
# ---------------------------------------------------------------------------

def build_phase2_system_prompt() -> str:
    """返回 Phase 2（匹配评分）的 System Prompt。"""
    return _load_prompt_file(path_config.phase2_prompt_path, "phase2")


def build_phase2_user_prompt(phase1_dimensions: list[Phase1Dimension], jd_quality: str, resume_json: dict) -> str:
    """
    构建 Phase 2 的 User Prompt，注入 Phase 1 分析结果和简历库。

    参数
    ----
    phase1_dimensions : list[Phase1Dimension]
        第一阶段产出的能力维度列表
    jd_quality : str
        JD 质量评估结果
    resume_json : dict
        简历库字典

    返回
    ----
    str : User Prompt
    """
    # 将 Phase1 维度转为简洁格式
    dims_for_prompt = []
    for d in phase1_dimensions:
        dim_entry = {
            "dimension_name": d.dimension_name,
            "weight": d.weight,
            "jd_basis": d.jd_basis,
        }
        if d.extension_note:
            dim_entry["extension_note"] = d.extension_note
        dims_for_prompt.append(dim_entry)

    phase1_json = json.dumps({
        "jd_quality": jd_quality,
        "dimensions": dims_for_prompt,
    }, ensure_ascii=False, indent=2)

    resume_str = json.dumps(resume_json, ensure_ascii=False, indent=2)

    user_prompt = f"""以下是第一阶段 JD 分析的结果和候选人简历库，请进行匹配评分：

## 第一阶段 JD 分析结果
```json
{phase1_json}
```

## 简历库
```json
{resume_str}
```

请按照你的 System Prompt 中的规则，对以上每个维度在简历库中寻找匹配经历、用二信号检查法评级、筛选排序 evidence、撰写 overall_assessment，并输出纯 JSON 结果。注意：维度名称、权重、jd_basis 必须原样继承，不得修改。"""

    return user_prompt


def build_phase2_messages(phase1_dimensions: list[Phase1Dimension], jd_quality: str, resume_json: dict) -> list[dict]:
    """
    构建 Phase 2 的完整 messages 列表。

    返回
    ----
    list[dict] : [{"role": "system", "content": ...}, {"role": "user", "content": ...}]
    """
    return [
        {"role": "system", "content": build_phase2_system_prompt()},
        {"role": "user", "content": build_phase2_user_prompt(phase1_dimensions, jd_quality, resume_json)},
    ]


# ---------------------------------------------------------------------------
# 兼容旧版：单次调用
# ---------------------------------------------------------------------------

def build_system_prompt() -> str:
    """兼容旧版：返回原始匹配器 System Prompt。"""
    return _load_prompt_file(path_config.prompt_template_path, "legacy")


def build_user_prompt(jd_text: str, resume_json: dict) -> str:
    """兼容旧版：构建包含 JD 和简历的 User Prompt。"""
    resume_str = json.dumps(resume_json, ensure_ascii=False, indent=2)

    user_prompt = f"""以下是本次需要匹配的岗位描述（JD）和候选人简历库：

## JD 文本
{jd_text}

## 简历库
```json
{resume_str}
```

请按照你的 System Prompt 中的规则，对以上 JD 和简历库进行分析匹配，并输出纯 JSON 结果。"""
    return user_prompt


def build_messages(jd_text: str, resume_json: dict) -> list[dict]:
    """兼容旧版：构建完整的 messages 列表。"""
    return [
        {"role": "system", "content": build_system_prompt()},
        {"role": "user", "content": build_user_prompt(jd_text, resume_json)},
    ]
