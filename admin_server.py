"""
个人网站 CMS 管理后台服务器
============================
提供文件上传、数据读写等功能，供 admin.html 调用。
基于 Python 内置 http.server，零额外 Web 框架依赖。

依赖: Pillow (pip install Pillow) — 用于图片 WebP 转换和模糊占位图生成

启动: python admin_server.py
访问: http://localhost:8766
"""

import sys, os, json, re, logging, shutil, uuid, io, time, mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# ---------- 配置 ----------
HOST = "127.0.0.1"
PORT = 8766
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_JS_PATH = os.path.join(PROJECT_ROOT, "data.js")
IMAGE_MAX_WIDTH = 1200       # WebP 显示版最大宽度
WEBP_QUALITY = 80            # WebP 显示版质量
BLUR_WIDTH = 20              # 模糊占位图宽度
BLUR_QUALITY = 30            # 模糊占位图质量

# 允许上传的目录白名单
ALLOWED_UPLOAD_DIRS = {
    "images",
    "images/backgrounds",
    "images/cover",
    "images/personal-photos",
    "images/research",
    "images/video-covers",
    "images/xhs-notes",
    "images/xhs-sections",
    "images/xhs-sections/account",
    "images/xhs-sections/competition",
    "images/xhs-sections/content",
    "images/xhs-sections/data",
    "images/xhs-sections/positioning",
    "images/xhs-ips",
    "images/photography",
    "images/photography/fengjing169",
    "images/photography/fengjing916",
    "images/photography/meishi169",
    "images/photography/meishi916",
    "images/photography/renwen169",
    "images/photography/renwen916",
    "videos",
    "downloads",
}

logging.basicConfig(level=logging.INFO, format="%(asctime)s [Admin] %(message)s")
logger = logging.getLogger(__name__)


# ============================================================
# 数据读写
# ============================================================

def read_data_js():
    """从 data.js 读取 APP_DATA，返回 Python dict。"""
    if not os.path.exists(DATA_JS_PATH):
        raise FileNotFoundError(f"data.js not found at {DATA_JS_PATH}")

    with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # 找到 APP_DATA = 后的 JSON 对象
    match = re.search(r'APP_DATA\s*=\s*', content)
    if not match:
        raise ValueError("Cannot find 'APP_DATA = ' in data.js")

    start = match.end()
    # 从 start 开始找到第一个 {
    brace_start = content.index('{', start)
    # 匹配括号找到对应的 }
    depth = 0
    in_string = False
    escape = False
    brace_end = brace_start
    for i in range(brace_start, len(content)):
        c = content[i]
        if escape:
            escape = False
            continue
        if c == '\\':
            escape = True
            continue
        if c == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                brace_end = i
                break

    json_str = content[brace_start:brace_end + 1]
    return json.loads(json_str)


def write_data_js(data):
    """将 Python dict 写入 data.js，格式化为 APP_DATA = {...};"""
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    # 将顶层缩进调整为 1 tab（与现有格式一致）
    content = f"APP_DATA = {json_str};\n"

    # 备份旧文件
    if os.path.exists(DATA_JS_PATH):
        bak_path = DATA_JS_PATH + ".bak"
        shutil.copy2(DATA_JS_PATH, bak_path)

    with open(DATA_JS_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    logger.info(f"data.js written ({len(json_str)} chars JSON)")


# ============================================================
# 图片处理
# ============================================================

def process_image(filepath):
    """
    处理上传的图片：
    1. 生成 .webp 显示版（1200px宽，quality 80，保留透明通道）
    2. 生成 _blur.webp 模糊占位（20px宽，quality 30）
    返回 (webp_path, blur_path) 相对路径元组
    """
    from PIL import Image

    img = Image.open(filepath)

    # 统一模式：保留 RGBA 透明通道
    if img.mode == 'P':
        img = img.convert('RGBA')
    elif img.mode == 'LA':
        img = img.convert('RGBA')
    elif img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')

    has_alpha = img.mode == 'RGBA'

    # 目录和文件名
    dirpath = os.path.dirname(filepath)
    basename = os.path.splitext(os.path.basename(filepath))[0]

    # 生成 WebP 显示版（保留透明）
    webp_path = os.path.join(dirpath, f"{basename}.webp")
    webp_img = img.copy()
    if webp_img.width > IMAGE_MAX_WIDTH:
        ratio = IMAGE_MAX_WIDTH / webp_img.width
        new_h = int(webp_img.height * ratio)
        webp_img = webp_img.resize((IMAGE_MAX_WIDTH, new_h), Image.LANCZOS)
    webp_img.save(webp_path, "WEBP", quality=WEBP_QUALITY)
    logger.info(f"WebP saved: {webp_path} ({webp_img.width}x{webp_img.height})")

    # 生成模糊占位图（透明区域用白色垫底，模糊图不需要透明）
    blur_path = os.path.join(dirpath, f"{basename}_blur.webp")
    blur_img = img.copy()
    if blur_img.mode == 'RGBA':
        bg = Image.new('RGB', blur_img.size, (255, 255, 255))
        bg.paste(blur_img, mask=blur_img.split()[3])
        blur_img = bg
    elif blur_img.mode != 'RGB':
        blur_img = blur_img.convert('RGB')
    if blur_img.width > BLUR_WIDTH:
        ratio = BLUR_WIDTH / blur_img.width
        new_h = max(1, int(blur_img.height * ratio))
        blur_img = blur_img.resize((BLUR_WIDTH, new_h), Image.LANCZOS)
    blur_img.save(blur_path, "WEBP", quality=BLUR_QUALITY)
    logger.info(f"Blur WebP saved: {blur_path} ({blur_img.width}x{blur_img.height})")

    # 返回相对路径
    rel_webp = os.path.relpath(webp_path, PROJECT_ROOT).replace("\\", "/")
    rel_blur = os.path.relpath(blur_path, PROJECT_ROOT).replace("\\", "/")
    return rel_webp, rel_blur


# ============================================================
# Multipart 解析
# ============================================================

def parse_multipart(body, content_type):
    """
    解析 multipart/form-data 请求体。
    返回 { field_name: (value, filename, content_type) } 字典。
    对于文本字段，filename 为 None。
    """
    # 提取 boundary
    boundary_match = re.search(r'boundary=([^;\s]+)', content_type)
    if not boundary_match:
        raise ValueError("No boundary found in Content-Type")
    boundary = boundary_match.group(1).encode()
    if boundary.startswith(b'"') and boundary.endswith(b'"'):
        boundary = boundary[1:-1]

    result = {}

    # 按 boundary 分割
    parts = body.split(b'--' + boundary)
    for part in parts:
        if not part or part == b'--\r\n' or part == b'--':
            continue

        # 分离 headers 和 body
        header_end = part.find(b'\r\n\r\n')
        if header_end == -1:
            continue
        headers_raw = part[:header_end].decode('utf-8', errors='replace')
        data = part[header_end + 4:]

        # 去掉末尾的 \r\n
        if data.endswith(b'\r\n'):
            data = data[:-2]

        # 解析 Content-Disposition
        cd_match = re.search(r'Content-Disposition:\s*form-data;\s*name="([^"]*)"(?:\s*;\s*filename="([^"]*)")?',
                             headers_raw, re.IGNORECASE)
        if not cd_match:
            continue

        field_name = cd_match.group(1)
        filename = cd_match.group(2)

        # 解析 Content-Type
        ct_match = re.search(r'Content-Type:\s*(.+)', headers_raw, re.IGNORECASE)
        field_ct = ct_match.group(1).strip() if ct_match else None

        result[field_name] = (data, filename, field_ct)

    return result


# ============================================================
# HTTP 请求处理器
# ============================================================

class AdminHandler(BaseHTTPRequestHandler):
    """管理后台 HTTP 请求处理器"""

    def log_message(self, format, *args):
        logger.info(f"{self.client_address[0]} - {format % args}")

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self._set_cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _set_cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_cors()
        self.end_headers()

    # ========== GET ==========

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        try:
            # API: 读取数据
            if path == "/api/data":
                data = read_data_js()
                self._send_json(200, {"ok": True, "data": data})
                return

            # API: 列出目录文件
            if path == "/api/files":
                dir_name = query.get("dir", [""])[0]
                result = self._list_files(dir_name)
                self._send_json(200, {"ok": True, "files": result})
                return

            # API: 健康检查
            if path == "/api/health":
                self._send_json(200, {"ok": True, "server": "admin"})
                return

            # 静态文件服务
            self._serve_static(path)

        except Exception as e:
            logger.error(f"GET {path} error: {e}")
            self._send_json(500, {"ok": False, "error": str(e)})

    # ========== POST ==========

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            # API: 保存数据
            if path == "/api/data":
                content_length = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(content_length)
                data = json.loads(raw.decode("utf-8"))
                write_data_js(data)
                self._send_json(200, {"ok": True, "message": "data.js saved"})
                return

            # API: 上传文件
            if path == "/api/upload":
                content_type = self.headers.get("Content-Type", "")
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)

                result = self._handle_upload(body, content_type)
                self._send_json(200, {"ok": True, **result})
                return

            # API: 上传视频
            if path == "/api/upload/video":
                content_type = self.headers.get("Content-Type", "")
                content_length = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_length)

                result = self._handle_video_upload(body, content_type)
                self._send_json(200, {"ok": True, **result})
                return

            self._send_json(404, {"ok": False, "error": "Not found"})

        except json.JSONDecodeError:
            self._send_json(400, {"ok": False, "error": "Invalid JSON"})
        except Exception as e:
            logger.error(f"POST {path} error: {e}")
            self._send_json(500, {"ok": False, "error": str(e)})

    # ========== DELETE ==========

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            if path == "/api/file":
                content_length = int(self.headers.get("Content-Length", 0))
                raw = self.rfile.read(content_length)
                body = json.loads(raw.decode("utf-8"))
                file_path = body.get("path", "")

                if not file_path:
                    self._send_json(400, {"ok": False, "error": "No path provided"})
                    return

                result = self._delete_file(file_path)
                self._send_json(200, {"ok": True, **result})
                return

            self._send_json(404, {"ok": False, "error": "Not found"})

        except json.JSONDecodeError:
            self._send_json(400, {"ok": False, "error": "Invalid JSON"})
        except Exception as e:
            logger.error(f"DELETE {path} error: {e}")
            self._send_json(500, {"ok": False, "error": str(e)})

    # ========== 静态文件服务 ==========

    def _serve_static(self, path):
        """提供项目根目录下的静态文件"""
        # 安全：防目录穿越
        safe_path = os.path.normpath(path.lstrip("/"))
        if safe_path.startswith("..") or os.path.isabs(safe_path):
            self._send_json(403, {"ok": False, "error": "Forbidden"})
            return

        # 默认首页 → 个人网站主页
        if safe_path == "" or safe_path == ".":
            safe_path = "index.html"

        filepath = os.path.join(PROJECT_ROOT, safe_path)

        # 只允许项目根目录内的文件
        real = os.path.realpath(filepath)
        if not real.startswith(os.path.realpath(PROJECT_ROOT)):
            self._send_json(403, {"ok": False, "error": "Forbidden"})
            return

        if not os.path.exists(filepath) or not os.path.isfile(filepath):
            self._send_json(404, {"ok": False, "error": "File not found"})
            return

        # 获取 MIME 类型
        mime_type, _ = mimetypes.guess_type(filepath)
        if not mime_type:
            mime_type = "application/octet-stream"

        # 读取并返回文件
        with open(filepath, "rb") as f:
            content = f.read()

        self.send_response(200)
        self.send_header("Content-Type", mime_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)

    # ========== 文件上传处理 ==========

    def _handle_upload(self, body, content_type):
        """处理图片上传"""
        fields = parse_multipart(body, content_type)

        # 获取目录参数
        dir_field = fields.get("directory")
        if not dir_field:
            raise ValueError("Missing 'directory' field in upload form")
        directory = dir_field[0].decode("utf-8").strip()

        # 获取文件
        file_field = None
        file_data = None
        original_name = None
        for name, (data, fname, ct) in fields.items():
            if fname:
                file_field = name
                file_data = data
                original_name = fname
                break

        if not file_data:
            raise ValueError("No file found in upload")

        # 安全检查：目录白名单
        directory = directory.strip("/").replace("\\", "/")
        if directory not in ALLOWED_UPLOAD_DIRS:
            raise ValueError(f"Upload directory not allowed: {directory}")

        # 生成安全文件名
        ext = os.path.splitext(original_name)[1].lower()
        if not ext:
            ext = ".jpg"
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_basename = f"upload_{timestamp}_{uuid.uuid4().hex[:6]}"
        safe_name = f"{safe_basename}{ext}"

        # 确保目标目录存在
        target_dir = os.path.join(PROJECT_ROOT, directory)
        os.makedirs(target_dir, exist_ok=True)

        # 保存原图
        dest_path = os.path.join(target_dir, safe_name)
        with open(dest_path, "wb") as f:
            f.write(file_data)
        logger.info(f"Original saved: {dest_path}")

        # 生成 WebP + blur
        try:
            webp_rel, blur_rel = process_image(dest_path)
            rel_path = os.path.relpath(dest_path, PROJECT_ROOT).replace("\\", "/")
            return {
                "path": webp_rel,          # 主路径（data.js 中使用的）
                "original": rel_path,
                "blur": blur_rel,
            }
        except Exception as e:
            # 图片处理失败，返回原路径
            logger.warning(f"Image processing failed: {e}, returning original")
            rel_path = os.path.relpath(dest_path, PROJECT_ROOT).replace("\\", "/")
            return {"path": rel_path, "warning": f"Image processing skipped: {e}"}

    def _handle_video_upload(self, body, content_type):
        """处理视频上传"""
        fields = parse_multipart(body, content_type)

        file_data = None
        original_name = None
        for name, (data, fname, ct) in fields.items():
            if fname:
                file_data = data
                original_name = fname
                break

        if not file_data:
            raise ValueError("No video file found in upload")

        # 安全检查
        directory = "videos"
        target_dir = os.path.join(PROJECT_ROOT, directory)
        os.makedirs(target_dir, exist_ok=True)

        # 生成安全文件名
        ext = os.path.splitext(original_name)[1].lower()
        if ext not in (".mp4", ".webm", ".mov", ".avi", ".mkv"):
            ext = ".mp4"
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        safe_basename = f"video_upload_{timestamp}_{uuid.uuid4().hex[:6]}"
        safe_name = f"{safe_basename}{ext}"

        dest_path = os.path.join(target_dir, safe_name)
        with open(dest_path, "wb") as f:
            f.write(file_data)
        logger.info(f"Video saved: {dest_path}")

        rel_path = os.path.relpath(dest_path, PROJECT_ROOT).replace("\\", "/")
        return {"path": rel_path}

    # ========== 文件操作 ==========

    def _list_files(self, dir_name):
        """列出指定目录的文件"""
        directory = dir_name.strip("/").replace("\\", "/")
        target_dir = os.path.join(PROJECT_ROOT, directory)

        # 安全
        real = os.path.realpath(target_dir)
        if not real.startswith(os.path.realpath(PROJECT_ROOT)):
            return []

        if not os.path.isdir(target_dir):
            return []

        files = []
        for f in sorted(os.listdir(target_dir)):
            fpath = os.path.join(target_dir, f)
            if os.path.isfile(fpath):
                # 只返回 web 友好的文件
                ext = os.path.splitext(f)[1].lower()
                if ext in (".webp", ".jpg", ".jpeg", ".png", ".gif", ".svg", ".mp4", ".webm", ".mov", ".pdf"):
                    rel = os.path.relpath(fpath, PROJECT_ROOT).replace("\\", "/")
                    size = os.path.getsize(fpath)
                    files.append({
                        "name": f,
                        "path": rel,
                        "size": size,
                        "mime": mimetypes.guess_type(f)[0] or "application/octet-stream",
                    })

        return files

    def _delete_file(self, file_path):
        """删除文件（仅限项目内的文件）"""
        file_path = file_path.lstrip("/").replace("\\", "/")
        target = os.path.join(PROJECT_ROOT, file_path)

        # 安全检查
        real = os.path.realpath(target)
        if not real.startswith(os.path.realpath(PROJECT_ROOT)):
            raise ValueError("Cannot delete files outside project")

        if not os.path.isfile(target):
            raise FileNotFoundError(f"File not found: {file_path}")

        # 不删除核心 JS/CSS/HTML
        basename = os.path.basename(target)
        protected = {"index.html", "admin.html", "data.js", "script.js",
                     "bundle.js", "bundle.css", "admin_server.py", "api_server.py"}
        if basename in protected:
            raise ValueError(f"Protected file: {basename}")

        os.remove(target)
        logger.info(f"Deleted: {target}")

        # 同时删除关联的 webp / blur 文件
        name_no_ext = os.path.splitext(basename)[0]
        dirpath = os.path.dirname(target)
        for sibling in os.listdir(dirpath):
            if sibling.startswith(name_no_ext) and sibling != basename:
                sib_path = os.path.join(dirpath, sibling)
                if os.path.isfile(sib_path):
                    os.remove(sib_path)
                    logger.info(f"Deleted related: {sib_path}")

        return {"deleted": file_path}


# ============================================================
# 启动
# ============================================================

def main():
    # 确保 admin.html 存在（如果不存在，打印提示）
    admin_html = os.path.join(PROJECT_ROOT, "admin.html")
    if not os.path.exists(admin_html):
        logger.warning("admin.html not found! The admin panel will not be accessible.")
        logger.warning("Create admin.html first, then restart the server.")

    server = HTTPServer((HOST, PORT), AdminHandler)
    server.allow_reuse_address = True
    logger.info(f"管理后台已启动 → http://{HOST}:{PORT}")
    logger.info(f"API 端点:")
    logger.info(f"  GET  /api/data       — 读取网站数据")
    logger.info(f"  POST /api/data       — 保存网站数据")
    logger.info(f"  POST /api/upload     — 上传图片（自动 WebP + blur）")
    logger.info(f"  POST /api/upload/video — 上传视频")
    logger.info(f"  DELETE /api/file     — 删除文件")
    logger.info(f"  GET  /api/files?dir= — 列出目录文件")
    logger.info(f"按 Ctrl+C 停止服务")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("管理后台已停止")
        server.server_close()


if __name__ == "__main__":
    main()
