"""
AI 岗位匹配器 —— API 服务器（v2 两阶段架构）
=============================================
使用 Python 内置 http.server，零额外依赖。
启动后前端可通过 http://localhost:8765/api/match 调用匹配服务。

v2 更新：
- 支持两阶段匹配（Phase 1 JD分析 + Phase 2 匹配评分）
- 支持交互式 JD 补充（当 JD 不足时返回问题，用户补充后再匹配）
- 请求体新增 supplement 和 round 字段
- 响应体新增 status 字段（complete / need_more_info / error）
"""

import sys, os, json, logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

# 将项目根目录加入 path（api_server.py 所在目录）
_PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from matcher_backend import JobMatcher

# ---------- 配置 ----------
HOST = "127.0.0.1"
PORT = 8765
KB_PATH = r"C:\Users\梁佳阳\Desktop\简历知识库\knowledge_base.json"
API_KEY = "sk-ws-H.RPRXIXE.kLA3.MEYCIQC7d9jVuzzVR8aRzW7wnCfiuhCCSUphOgamktuthrrUOwIhAJdfNI3BiPHqxzSz3iQddVZ5gMpX8_NovMMeCqBn1TU4"
API_BASE = "https://dashscope.aliyuncs.com/compatible-mode/v1"
MODEL = "qwen-plus"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [API] %(message)s")
logger = logging.getLogger(__name__)

# 初始化匹配器（单例）
matcher = JobMatcher(api_key=API_KEY, api_base=API_BASE, model=MODEL)


class MatchHandler(BaseHTTPRequestHandler):
    """HTTP 请求处理器 —— 处理 /api/match POST 和 /api/health GET"""

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._set_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        """CORS 预检请求"""
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    def do_GET(self):
        """健康检查"""
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._send_json(200, {"status": "ok", "version": "2.0"})
        else:
            self._send_json(404, {"error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/match":
            self._send_json(404, {"error": "Not found, only /api/match is supported"})
            return

        try:
            # 读取请求体
            content_length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(content_length)
            body = json.loads(raw.decode("utf-8"))
            jd_text = body.get("jd", "").strip()
            supplement = body.get("supplement", "").strip()
            round_num = int(body.get("round", 1))

            if len(jd_text) < 10:
                self._send_json(400, {
                    "status": "error",
                    "error": "JD 文本过短（至少10字符）",
                })
                return

            log_parts = [f"Round {round_num}", f"JD ({len(jd_text)} chars)"]
            if supplement:
                log_parts.append(f"supplement ({len(supplement)} chars)")
            logger.info(f"Matching: {', '.join(log_parts)} ...")

            # 执行两阶段匹配
            response = matcher.match(
                jd_source=jd_text,
                resume_source=KB_PATH,
                supplement=supplement,
                round_num=round_num,
                verbose=False,
            )

            if response.status == "complete":
                result = response.result
                logger.info(
                    f"Done — {len(result.dimensions)} dimensions, "
                    f"quality={result.jd_quality}, "
                    f"round={round_num}"
                )
                self._send_json(200, response.to_dict())
            elif response.status == "need_more_info":
                logger.info(
                    f"Need more info — {len(response.questions)} questions, "
                    f"round={round_num}"
                )
                self._send_json(200, response.to_dict())
            else:
                logger.error(f"Match error: {response.error}")
                self._send_json(500, response.to_dict())

        except json.JSONDecodeError:
            self._send_json(400, {"status": "error", "error": "请求体不是合法 JSON"})
        except Exception as e:
            logger.error(f"Match failed: {e}")
            self._send_json(500, {"status": "error", "error": f"匹配失败: {str(e)}"})


def main():
    server = HTTPServer((HOST, PORT), MatchHandler)
    logger.info(f"AI 岗位匹配器 API v2 已启动 → http://{HOST}:{PORT}/api/match")
    logger.info(f"健康检查 → http://{HOST}:{PORT}/api/health")
    logger.info(f"按 Ctrl+C 停止服务")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("服务已停止")
        server.server_close()


if __name__ == "__main__":
    main()
