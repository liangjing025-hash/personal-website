"""
AI 岗位匹配器 —— matcher_backend 包（v2 两阶段架构）
====================================================
基于大语言模型的简历-JD 智能匹配引擎 + 知识库维护 Agent。

v2 更新：
- 两阶段匹配：Phase 1 JD 分析 → Phase 2 匹配评分
- 交互式 JD 补充：JD 不足时返回问题，用户补充后再匹配

使用方式
--------
# 匹配器（两阶段，推荐）
from matcher_backend import JobMatcher
matcher = JobMatcher(api_key="sk-xxx")
response = matcher.match("JD文本...", "简历.json")
if response.status == "complete":
    print(response.result.overall_assessment)
elif response.status == "need_more_info":
    for q in response.questions:
        print(q.question)

# 旧版兼容
result = matcher.match_legacy("JD文本...", "简历.json")

# 知识库 Agent
from matcher_backend import KnowledgeBaseAgent
agent = KnowledgeBaseAgent(api_key="sk-xxx")
summary = agent.update("新简历.pdf")
"""

from .matcher import JobMatcher
from .kb_agent import KnowledgeBaseAgent
from .models import (
    # 第二阶段
    MatchResult,
    DimensionResult,
    # 第一阶段
    Phase1Result,
    Phase1Dimension,
    QuestionItem,
    # API 响应
    MatchResponse,
    # 异常
    MatchError,
    DataLoadError,
    PromptBuildError,
    LLMCallError,
    JSONParseError,
    SchemaValidationError,
)
from .data_loader import load_inputs, load_jd_text, load_resume_json
from .prompt_builder import (
    build_messages,
    build_system_prompt,
    build_phase1_messages,
    build_phase2_messages,
    build_phase1_system_prompt,
    build_phase2_system_prompt,
)
from .llm_client import (
    clean_json_text,
    run_matching_with_retry,
    run_phase1,
    run_phase2,
    call_llm_with_messages,
)
from .config import llm_config, retry_config, path_config

__all__ = [
    # 主入口
    "JobMatcher",
    "KnowledgeBaseAgent",
    # 数据模型
    "MatchResult",
    "DimensionResult",
    "Phase1Result",
    "Phase1Dimension",
    "QuestionItem",
    "MatchResponse",
    # 异常
    "MatchError",
    "DataLoadError",
    "PromptBuildError",
    "LLMCallError",
    "JSONParseError",
    "SchemaValidationError",
    # 底层函数
    "load_inputs",
    "load_jd_text",
    "load_resume_json",
    "build_messages",
    "build_system_prompt",
    "build_phase1_messages",
    "build_phase2_messages",
    "build_phase1_system_prompt",
    "build_phase2_system_prompt",
    "clean_json_text",
    "run_matching_with_retry",
    "run_phase1",
    "run_phase2",
    "call_llm_with_messages",
    # 配置
    "llm_config",
    "retry_config",
    "path_config",
]
