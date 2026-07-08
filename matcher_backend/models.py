"""
数据模型与自定义异常
-------------------
定义匹配结果的结构体，以及 LLM 调用链中可能抛出的自定义异常。

v2 更新：
- 新增 Phase1Result / Phase1Dimension：第一阶段 JD 分析输出
- 新增 QuestionItem：JD 不足时的补充问题
- 新增 MatchResponse：API 统一响应（区分完整结果 / 需要补充信息）
"""

from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# 自定义异常
# ---------------------------------------------------------------------------

class MatchError(Exception):
    """匹配器基础异常"""
    pass


class PromptBuildError(MatchError):
    """Prompt 模板构建失败（如模板文件不可读、变量缺失等）"""
    pass


class LLMCallError(MatchError):
    """大模型调用失败（网络错误、API 返回异常等）"""
    pass


class JSONParseError(MatchError):
    """大模型返回的文本无法解析为合法 JSON"""
    pass


class SchemaValidationError(MatchError):
    """JSON 缺乏核心字段（如 dimensions / overall_assessment）"""
    pass


class DataLoadError(MatchError):
    """输入数据加载失败（JD 为空、简历 JSON 格式错误等）"""
    pass


# ---------------------------------------------------------------------------
# 第一阶段：JD 分析结果
# ---------------------------------------------------------------------------

@dataclass
class Phase1Dimension:
    """第一阶段产出的单个能力维度（不含 rating/evidence）"""
    dimension_name: str           # 维度名称（JD驱动）
    weight: int = 0               # 百分比权重（0-100）
    jd_basis: str = ""            # JD原文依据
    extension_note: str = ""      # 延伸/补全说明（仅延伸或补全时有值）


@dataclass
class QuestionItem:
    """JD 信息不足时生成的补充问题"""
    question: str                 # 问题内容
    reason: str                   # 为什么需要问这个问题


@dataclass
class Phase1Result:
    """第一阶段 JD 分析的完整输出"""
    jd_quality: str               # 充足 / 一般 / 不足
    overall_understanding: str    # ≤150字的第一人称整体岗位判断
    dimensions: List[Phase1Dimension] = field(default_factory=list)
    questions: List[QuestionItem] = field(default_factory=list)
    self_check: dict = field(default_factory=dict)  # 自查清单

    @property
    def is_insufficient(self) -> bool:
        """JD 是否判定为不足"""
        return self.jd_quality == "不足"

    @property
    def has_dimensions(self) -> bool:
        """是否有可用的维度（至少1个）"""
        return len(self.dimensions) >= 1

    def to_dict(self) -> dict:
        return {
            "jd_quality": self.jd_quality,
            "overall_understanding": self.overall_understanding,
            "dimensions": [
                {
                    "dimension_name": d.dimension_name,
                    "weight": d.weight,
                    "jd_basis": d.jd_basis,
                    "extension_note": d.extension_note,
                }
                for d in self.dimensions
            ],
            "questions": [
                {"question": q.question, "reason": q.reason}
                for q in self.questions
            ],
            "self_check": self.self_check,
        }


# ---------------------------------------------------------------------------
# 第二阶段：匹配评分结果
# ---------------------------------------------------------------------------

@dataclass
class DimensionResult:
    """单个维度的匹配结果（包含评分和证据）"""
    dimension_name: str           # 维度名称（继承 Phase1Dimension）
    weight: int = 0               # 百分比权重（继承 Phase1Dimension）
    jd_basis: str = ""            # JD原文依据（继承 Phase1Dimension）
    rating: str = ""              # 评级：优秀/良好/一般/待确认
    evidence: List[str] = field(default_factory=list)


@dataclass
class MatchResult:
    """第二阶段的完整匹配输出"""
    candidate_name: str
    jd_quality: str               # 充足/一般/不足（继承第一阶段）
    overall_assessment: str       # 150 字以内的第一人称匹配总结
    dimensions: List[DimensionResult] = field(default_factory=list)

    def is_valid(self) -> bool:
        """快速校验核心字段是否齐全"""
        return bool(
            self.candidate_name
            and self.jd_quality
            and self.overall_assessment
            and len(self.dimensions) >= 1
        )

    def to_dict(self) -> dict:
        """转为 JSON 可序列化的字典"""
        return {
            "candidate_name": self.candidate_name,
            "jd_quality": self.jd_quality,
            "overall_assessment": self.overall_assessment,
            "dimensions": [
                {
                    "dimension_name": d.dimension_name,
                    "weight": d.weight,
                    "jd_basis": d.jd_basis,
                    "rating": d.rating,
                    "evidence": d.evidence,
                }
                for d in self.dimensions
            ],
        }


# ---------------------------------------------------------------------------
# API 统一响应
# ---------------------------------------------------------------------------

@dataclass
class MatchResponse:
    """
    API 层统一响应，区分三种状态：
    - complete: 匹配完成，result 包含完整 MatchResult
    - need_more_info: JD 不足，questions 包含待补充问题列表
    - error: 处理失败，error 包含错误信息
    """
    status: str                   # "complete" | "need_more_info" | "error"
    result: Optional[MatchResult] = None
    questions: List[QuestionItem] = field(default_factory=list)
    jd_quality: str = ""          # 透传 JD 质量判断
    round: int = 0                # 当前交互轮次
    error: str = ""               # 错误信息（仅 status="error" 时）

    def to_dict(self) -> dict:
        d: dict = {
            "status": self.status,
            "jd_quality": self.jd_quality,
            "round": self.round,
        }
        if self.result:
            d["result"] = self.result.to_dict()
        if self.questions:
            d["questions"] = [
                {"question": q.question, "reason": q.reason}
                for q in self.questions
            ]
        if self.error:
            d["error"] = self.error
        return d
