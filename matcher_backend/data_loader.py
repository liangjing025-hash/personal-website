"""
数据加载模块
------------
负责读取 JD 文本和简历 JSON，做基础校验后交付给下游模块。
"""

import json
import os
from .config import path_config
from .models import DataLoadError


def load_jd_text(jd_source: str) -> str:
    """
    加载 JD 文本。

    参数
    ----
    jd_source : str
        可以是：
        - 一段直接的 JD 文本字符串
        - 指向 .txt / .md 文件的本地路径

    返回
    ----
    str : 清洗后的 JD 文本
    """
    # 情况1：jd_source 看起来像文件路径
    if os.path.exists(jd_source) and os.path.isfile(jd_source):
        with open(jd_source, "r", encoding="utf-8") as f:
            text = f.read().strip()
    else:
        # 情况2：直接传入的字符串
        text = jd_source.strip()

    if len(text) < 10:
        raise DataLoadError(
            f"JD 文本过短（{len(text)} 字符），请提供完整的岗位描述。"
        )
    return text


def load_resume_json(resume_source: str | dict) -> dict:
    """
    加载简历库 JSON。

    参数
    ----
    resume_source : str | dict
        可以是：
        - 一个已解析好的 dict
        - 指向本地 .json 文件的路径
        - 一段 JSON 字符串

    返回
    ----
    dict : 简历库数据
    """
    if isinstance(resume_source, dict):
        # 已经是一个字典，直接校验
        data = resume_source
    elif os.path.exists(resume_source) and os.path.isfile(resume_source):
        # 本地 JSON 文件路径
        with open(resume_source, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        # 尝试作为 JSON 字符串解析
        try:
            data = json.loads(resume_source)
        except json.JSONDecodeError as e:
            raise DataLoadError(f"简历 JSON 解析失败: {e}")

    # 基础字段校验
    required_fields = ["candidate_name", "experience_library"]
    for field in required_fields:
        if field not in data:
            raise DataLoadError(f"简历库缺少必要字段: {field}")

    if not isinstance(data.get("experience_library"), list):
        raise DataLoadError("experience_library 必须是一个数组")

    # 过滤敏感字段（phone/email 不参与匹配，不应发给 LLM）
    fixed_info = data.get("fixed_info", {})
    if isinstance(fixed_info, dict):
        fixed_info.pop("phone", None)
        fixed_info.pop("email", None)
    
    return data


def load_inputs(jd_source: str, resume_source: str | dict) -> tuple[str, dict]:
    """
    便捷函数：一次性加载 JD 文本和简历 JSON。

    返回 (jd_text, resume_dict)
    """
    jd_text = load_jd_text(jd_source)
    resume_dict = load_resume_json(resume_source)
    return jd_text, resume_dict
