"""
LLM 调用与解析模块（v2 两阶段架构）
----------------------------------
封装大模型 API 调用，包含：
1. JSON 清洗（正则剔除 Markdown 标记和多余解释文字）
2. Phase 1：JD 分析调用 + 解析校验
3. Phase 2：匹配评分调用 + 解析校验
4. 兼容旧版：单次调用 run_matching_with_retry
"""

import json
import re
import time
from .config import llm_config, retry_config
from .prompt_builder import (
    build_phase1_messages,
    build_phase2_messages,
    build_messages,  # 兼容旧版
)
from .models import (
    LLMCallError,
    JSONParseError,
    SchemaValidationError,
    MatchError,
    Phase1Result,
    Phase1Dimension,
    QuestionItem,
    MatchResult,
    DimensionResult,
)


# ---------------------------------------------------------------------------
# 1. JSON 清洗函数 —— 核心容错逻辑
# ---------------------------------------------------------------------------

def clean_json_text(raw_text: str) -> str:
    """清洗 LLM 返回的原始文本，剔除 Markdown 标记和前后废话，确保 json.loads() 能 100% 解析成功。

    处理策略（按顺序）：
    1. 移除 ```json ... ``` 包裹
    2. 移除 ``` ... ``` 包裹（无语言标注）
    3. 如果以上都没匹配到，尝试提取第一个 { 到最后一个 } 之间的内容
    4. 去除首尾空白与不可见字符
    """
    text = raw_text.strip()

    # 策略1：匹配 ```json ... ``` 代码块
    pattern_json_block = re.compile(
        r"```json\s*\n?(.*?)\n?```", re.DOTALL | re.IGNORECASE
    )
    match = pattern_json_block.search(text)
    if match:
        return match.group(1).strip()

    # 策略2：匹配 ``` ... ``` 代码块（无语言标注）
    pattern_plain_block = re.compile(
        r"```\s*\n?(.*?)\n?```", re.DOTALL
    )
    match = pattern_plain_block.search(text)
    if match:
        return match.group(1).strip()

    # 策略3：提取从第一个 { 到最后一个 } 的内容
    first_brace = text.find("{")
    last_brace = text.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace:last_brace + 1].strip()

    # 兜底：返回原文本
    return text


# ---------------------------------------------------------------------------
# 2. 通用 LLM 调用
# ---------------------------------------------------------------------------

def _call_via_urllib(
    messages: list[dict],
    api_key: str,
    api_base: str,
    model: str,
    temperature: float,
) -> str:
    """通过 urllib 直连 OpenAI 兼容 API（无需额外 SDK）。"""
    import urllib.request, urllib.error
    payload = json.dumps({
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": llm_config.max_tokens,
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{api_base}/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=llm_config.timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            content = body["choices"][0]["message"]["content"]
            if content is None:
                raise LLMCallError("LLM returned empty content")
            return content
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        raise LLMCallError(f"API request failed ({e.code}): {detail}") from e
    except Exception as e:
        raise LLMCallError(f"urllib call failed: {e}") from e


def call_llm_with_messages(
    messages: list[dict],
    api_key: str | None = None,
    api_base: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
) -> str:
    """Send messages via OpenAI-compatible API. Uses openai SDK if available, falls back to urllib."""
    resolved_key = api_key or llm_config.api_key
    resolved_base = (api_base or llm_config.api_base).rstrip("/")
    resolved_model = model or llm_config.model
    resolved_temp = temperature if temperature is not None else llm_config.temperature

    # Try openai SDK first
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=resolved_key,
            base_url=resolved_base,
            timeout=llm_config.timeout,
        )
        response = client.chat.completions.create(
            model=resolved_model,
            messages=messages,
            temperature=resolved_temp,
            max_tokens=llm_config.max_tokens,
        )
        content = response.choices[0].message.content
        if content is None:
            raise LLMCallError("LLM returned empty content")
        return content
    except ImportError:
        return _call_via_urllib(messages, resolved_key, resolved_base, resolved_model, resolved_temp)
    except Exception as e:
        if not isinstance(e, LLMCallError):
            try:
                return _call_via_urllib(messages, resolved_key, resolved_base, resolved_model, resolved_temp)
            except Exception:
                pass
        raise LLMCallError(f"LLM API call failed: {e}") from e


# ---------------------------------------------------------------------------
# 3. Phase 1：JD 分析 —— 解析 + 校验
# ---------------------------------------------------------------------------

def _parse_phase1_response(raw_text: str) -> Phase1Result:
    """解析 Phase 1 的 LLM 返回，清洗 + json.loads + 字段校验。"""
    cleaned = clean_json_text(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise JSONParseError(
            f"Phase 1 清洗后仍然无法解析为 JSON: {e}\n"
            f"清洗后内容前200字符: {cleaned[:200]}"
        )

    # 核心字段校验
    if data.get("phase") != "jd_analysis":
        raise SchemaValidationError(
            f"Phase 1 输出的 phase 字段不正确，期望 'jd_analysis'，得到 '{data.get('phase')}'"
        )

    missing = []
    for field in ["jd_quality", "overall_understanding", "dimensions"]:
        if field not in data:
            missing.append(field)
    if missing:
        raise SchemaValidationError(
            f"Phase 1 返回的 JSON 缺少核心字段: {', '.join(missing)}"
        )

    # jd_quality 校验
    if data["jd_quality"] not in ("充足", "一般", "不足"):
        raise SchemaValidationError(
            f"jd_quality 值不合法: {data['jd_quality']}，期望 充足/一般/不足"
        )

    # dimensions 校验
    if not isinstance(data.get("dimensions"), list):
        raise SchemaValidationError("Phase 1 dimensions 字段必须是一个数组")

    # 如果 dimensions 有值，校验每条
    weight_sum = 0
    for i, dim in enumerate(data["dimensions"]):
        if "dimension_name" not in dim:
            raise SchemaValidationError(f"Phase 1 dimensions[{i}] 缺少 dimension_name")
        if "weight" not in dim:
            raise SchemaValidationError(f"Phase 1 dimensions[{i}] 缺少 weight")
        if "jd_basis" not in dim:
            raise SchemaValidationError(f"Phase 1 dimensions[{i}] 缺少 jd_basis")
        weight_sum += int(dim["weight"])

    # 如果有维度，权重总和应在 95-105 之间
    if len(data["dimensions"]) > 0:
        if weight_sum < 90 or weight_sum > 110:
            raise SchemaValidationError(
                f"Phase 1 所有维度 weight 之和应为 100，当前为 {weight_sum}，偏差过大"
            )

    # self_check 校验
    if "self_check" in data:
        sc = data["self_check"]
        for key in ["portrait_done", "keyword_anchored", "five_signals_done", "phase_isolated", "jd_quality_triggered", "format_correct"]:
            if key in sc and not sc[key]:
                raise SchemaValidationError(
                    f"Phase 1 自查清单未通过: {key} = {sc[key]}"
                )

    # 构建 Phase1Result
    dimensions = [
        Phase1Dimension(
            dimension_name=d["dimension_name"],
            weight=int(d.get("weight", 0)),
            jd_basis=d.get("jd_basis", ""),
            extension_note=d.get("extension_note", ""),
        )
        for d in data.get("dimensions", [])
    ]

    questions = [
        QuestionItem(question=q.get("question", ""), reason=q.get("reason", ""))
        for q in data.get("questions", [])
    ]

    return Phase1Result(
        jd_quality=data["jd_quality"],
        overall_understanding=data.get("overall_understanding", ""),
        dimensions=dimensions,
        questions=questions,
        self_check=data.get("self_check", {}),
    )


def run_phase1(
    jd_text: str,
    api_key: str | None = None,
    api_base: str | None = None,
    model: str | None = None,
) -> Phase1Result:
    """
    执行 Phase 1：JD 分析。

    流程：
    1. 构建 Phase 1 messages
    2. 调用 LLM
    3. 清洗 + 解析 JSON
    4. 校验核心字段 + 自查清单
    5. 如失败，按指数退避重试
    """
    messages = build_phase1_messages(jd_text)
    last_error: Exception | None = None

    for attempt in range(1, retry_config.max_retries + 1):
        try:
            raw_response = call_llm_with_messages(
                messages,
                api_key=api_key,
                api_base=api_base,
                model=model,
                temperature=0.1,  # Phase 1 使用更低温度确保分析稳定性
            )
            return _parse_phase1_response(raw_response)
        except (LLMCallError, JSONParseError, SchemaValidationError) as e:
            last_error = e
            if attempt < retry_config.max_retries:
                delay = retry_config.base_delay * (retry_config.backoff_factor ** (attempt - 1))
                time.sleep(delay)
                continue

    raise MatchError(
        f"Phase 1 JD 分析失败，已重试 {retry_config.max_retries} 次。"
        f"最后一次错误: {last_error}"
    ) from last_error


# ---------------------------------------------------------------------------
# 4. Phase 2：匹配评分 —— 解析 + 校验
# ---------------------------------------------------------------------------

def _parse_phase2_response(raw_text: str, expected_dimensions: list[Phase1Dimension]) -> MatchResult:
    """解析 Phase 2 的 LLM 返回，清洗 + json.loads + 字段校验。"""
    cleaned = clean_json_text(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise JSONParseError(
            f"Phase 2 清洗后仍然无法解析为 JSON: {e}\n"
            f"清洗后内容前200字符: {cleaned[:200]}"
        )

    # 核心字段校验
    missing = []
    for field in ["candidate_name", "jd_quality", "overall_assessment", "dimensions"]:
        if field not in data:
            missing.append(field)
    if missing:
        raise SchemaValidationError(
            f"Phase 2 返回的 JSON 缺少核心字段: {', '.join(missing)}"
        )

    # dimensions 必须是非空数组
    if not isinstance(data.get("dimensions"), list) or len(data["dimensions"]) == 0:
        raise SchemaValidationError(
            "Phase 2 dimensions 字段为空或不是数组，无法构成有效的匹配报告。"
        )

    # 校验 Phase 2 没有修改维度名称（应该和 Phase 1 一致）
    phase1_names = {d.dimension_name for d in expected_dimensions}
    for i, dim in enumerate(data["dimensions"]):
        if "dimension_name" not in dim:
            raise SchemaValidationError(f"Phase 2 dimensions[{i}] 缺少 dimension_name")
        if dim["dimension_name"] not in phase1_names:
            # 不允许 Phase 2 新增维度，但不做硬失败——可能是 LLM 微调了名称
            pass
        if "weight" not in dim:
            raise SchemaValidationError(f"Phase 2 dimensions[{i}] 缺少 weight")
        if "jd_basis" not in dim:
            raise SchemaValidationError(f"Phase 2 dimensions[{i}] 缺少 jd_basis")
        if "rating" not in dim:
            raise SchemaValidationError(f"Phase 2 dimensions[{i}] 缺少 rating")
        if dim["rating"] not in ("优秀", "良好", "一般", "待确认"):
            raise SchemaValidationError(f"Phase 2 dimensions[{i}] rating 值不合法: {dim['rating']}")
        if "evidence" not in dim or not isinstance(dim["evidence"], list):
            raise SchemaValidationError(
                f"Phase 2 dimensions[{i}] 缺少 evidence 或 evidence 不是数组"
            )
        if len(dim["evidence"]) == 0:
            raise SchemaValidationError(
                f"Phase 2 dimensions[{i}] evidence 不能为空"
            )

    # 构建 MatchResult
    dimensions = [
        DimensionResult(
            dimension_name=d["dimension_name"],
            weight=int(d.get("weight", 0)),
            jd_basis=d.get("jd_basis", ""),
            rating=d["rating"],
            evidence=d.get("evidence", []),
        )
        for d in data["dimensions"]
    ]

    return MatchResult(
        candidate_name=data["candidate_name"],
        jd_quality=data["jd_quality"],
        overall_assessment=data["overall_assessment"],
        dimensions=dimensions,
    )


def run_phase2(
    phase1_dimensions: list[Phase1Dimension],
    jd_quality: str,
    resume_json: dict,
    api_key: str | None = None,
    api_base: str | None = None,
    model: str | None = None,
) -> MatchResult:
    """
    执行 Phase 2：匹配评分。

    流程：
    1. 构建 Phase 2 messages（注入 Phase 1 维度 + 简历）
    2. 调用 LLM
    3. 清洗 + 解析 JSON
    4. 校验核心字段
    5. 如失败，按指数退避重试
    """
    messages = build_phase2_messages(phase1_dimensions, jd_quality, resume_json)
    last_error: Exception | None = None

    for attempt in range(1, retry_config.max_retries + 1):
        try:
            raw_response = call_llm_with_messages(
                messages,
                api_key=api_key,
                api_base=api_base,
                model=model,
            )
            return _parse_phase2_response(raw_response, phase1_dimensions)
        except (LLMCallError, JSONParseError, SchemaValidationError) as e:
            last_error = e
            if attempt < retry_config.max_retries:
                delay = retry_config.base_delay * (retry_config.backoff_factor ** (attempt - 1))
                time.sleep(delay)
                continue

    raise MatchError(
        f"Phase 2 匹配评分失败，已重试 {retry_config.max_retries} 次。"
        f"最后一次错误: {last_error}"
    ) from last_error


# ---------------------------------------------------------------------------
# 5. 兼容旧版：单次调用
# ---------------------------------------------------------------------------

def _parse_and_validate(raw_text: str) -> dict:
    """旧版兼容：清洗 + 解析 + 核心字段校验。"""
    cleaned = clean_json_text(raw_text)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise JSONParseError(
            f"清洗后仍然无法解析为 JSON: {e}\n"
            f"清洗后内容前200字符: {cleaned[:200]}"
        )

    # 核心字段校验
    missing = []
    for field in ["candidate_name", "jd_quality", "overall_assessment", "dimensions"]:
        if field not in data:
            missing.append(field)

    if missing:
        raise SchemaValidationError(
            f"LLM 返回的 JSON 缺少核心字段: {', '.join(missing)}"
        )

    if not isinstance(data.get("dimensions"), list) or len(data["dimensions"]) == 0:
        raise SchemaValidationError(
            "dimensions 字段为空或不是数组，无法构成有效的匹配报告。"
        )

    # 校验 dimensions 里的每条是否具备必要字段
    weight_sum = 0
    for i, dim in enumerate(data["dimensions"]):
        if "dimension_name" not in dim:
            raise SchemaValidationError(f"dimensions[{i}] 缺少 dimension_name")
        if "weight" not in dim:
            raise SchemaValidationError(f"dimensions[{i}] 缺少 weight")
        if "jd_basis" not in dim:
            raise SchemaValidationError(f"dimensions[{i}] 缺少 jd_basis")
        if "rating" not in dim:
            raise SchemaValidationError(f"dimensions[{i}] 缺少 rating")
        if "evidence" not in dim or not isinstance(dim["evidence"], list):
            raise SchemaValidationError(
                f"dimensions[{i}] 缺少 evidence 或 evidence 不是数组"
            )
        weight_sum += int(dim["weight"])

    if weight_sum < 90 or weight_sum > 110:
        raise SchemaValidationError(
            f"所有维度 weight 之和应为 100，当前为 {weight_sum}，偏差过大"
        )

    return data


def _dict_to_match_result(data: dict) -> MatchResult:
    """将校验通过的字典转为 MatchResult 对象"""
    dimensions = [
        DimensionResult(
            dimension_name=d["dimension_name"],
            weight=int(d.get("weight", 0)),
            jd_basis=d.get("jd_basis", ""),
            rating=d["rating"],
            evidence=d.get("evidence", []),
        )
        for d in data.get("dimensions", [])
    ]
    return MatchResult(
        candidate_name=data["candidate_name"],
        jd_quality=data["jd_quality"],
        overall_assessment=data["overall_assessment"],
        dimensions=dimensions,
    )


def run_matching_with_retry(
    jd_text: str,
    resume_json: dict,
    api_key: str | None = None,
    api_base: str | None = None,
    model: str | None = None,
) -> MatchResult:
    """旧版兼容：执行一次完整的"匹配 + 解析 + 重试"流程。"""
    messages = build_messages(jd_text, resume_json)
    last_error: Exception | None = None

    for attempt in range(1, retry_config.max_retries + 1):
        try:
            raw_response = call_llm_with_messages(
                messages,
                api_key=api_key,
                api_base=api_base,
                model=model,
            )
            validated_data = _parse_and_validate(raw_response)
            result = _dict_to_match_result(validated_data)
            return result

        except (LLMCallError, JSONParseError, SchemaValidationError) as e:
            last_error = e
            if attempt < retry_config.max_retries:
                delay = retry_config.base_delay * (retry_config.backoff_factor ** (attempt - 1))
                time.sleep(delay)
                continue

    raise MatchError(
        f"匹配失败，已重试 {retry_config.max_retries} 次。"
        f"最后一次错误: {last_error}"
    ) from last_error
