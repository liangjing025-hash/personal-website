"""
配置中心
-------
集中管理 LLM API 参数、重试策略、路径等所有可配置项。
实际部署时可将敏感信息移入环境变量或 .env 文件。
"""

import os
from dataclasses import dataclass, field


@dataclass
class LLMConfig:
    """大模型调用配置"""
    # API 端点与密钥 —— 替换为你实际使用的 LLM 服务商
    api_key: str = field(
        default_factory=lambda: os.getenv("LLM_API_KEY", "your-api-key-here")
    )
    api_base: str = field(
        default_factory=lambda: os.getenv("LLM_API_BASE", "https://dashscope.aliyuncs.com/compatible-mode/v1")
    )
    model: str = field(
        default_factory=lambda: os.getenv("LLM_MODEL", "qwen-plus")
    )
    # temperature 设在 0.1-0.3 之间，保证逻辑推理和 JSON 格式的稳定性
    temperature: float = 0.2
    max_tokens: int = 4096
    timeout: int = 60  # 请求超时秒数


@dataclass
class RetryConfig:
    """重试策略配置"""
    max_retries: int = 3           # 最大重试次数
    base_delay: float = 1.0        # 基础等待秒数
    backoff_factor: float = 2.0    # 指数退避因子


@dataclass
class PathConfig:
    """文件路径配置"""
    # 项目根目录
    _project_root: str = field(default_factory=lambda: os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # Phase 1: JD 分析 Prompt 模板
    phase1_prompt_path: str = ""
    # Phase 2: 匹配评分 Prompt 模板
    phase2_prompt_path: str = ""
    # 原始 Prompt 模板（兼容旧版）
    prompt_template_path: str = ""
    # 默认简历库 JSON 路径（可在运行时覆盖）
    resume_library_path: str = ""

    def __post_init__(self):
        prompt_dir = os.path.join(self._project_root, "匹配器prompt")
        if not self.phase1_prompt_path:
            self.phase1_prompt_path = os.path.join(prompt_dir, "phase1_jd_analysis.txt")
        if not self.phase2_prompt_path:
            self.phase2_prompt_path = os.path.join(prompt_dir, "phase2_matching.txt")
        if not self.prompt_template_path:
            self.prompt_template_path = os.path.join(prompt_dir, "匹配器.txt")


# 全局单例
llm_config = LLMConfig()
retry_config = RetryConfig()
path_config = PathConfig()
