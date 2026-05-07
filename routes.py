"""Flask-Routes für die Web-App."""
import json
import queue
import threading
import time
import uuid

from flask import Response, jsonify, render_template, request

from config import ALL_FORMATS, DOWNLOAD_DIR, YTDLP_STATUS, ensure_ytdlp_fresh
from downloader import TASK_QUEUES, TASK_STATE, cancel_task, extract_video_info, run_task


def register_routes(app):
    """Registriert alle Routes auf der Flask-App."""

    @app.route("/")
    def index():
        return render_template(
            "index.html",
            formats=sorted(ALL_FORMATS),
            ytdlp_status=YTDLP_STATUS,
            download_dir=DOWNLOAD_DIR,
        )

    @app.post("/api/download")
    def api_download():
        payload = request.get_json(force=True, silent=True) or {}
        raw_items = payload.get("items") or []
        items: list[dict] = []
        for item in raw_items:
            url = (item.get("url") or "").strip()
            fmt = (item.get("format") or "").strip().lower()
            if not url:
                continue
            if fmt not in ALL_FORMATS:
                return jsonify({"error": f"Ungültiges Format: {fmt}"}), 400
            playlist = bool(item.get("playlist", False))
            items.append({"url": url, "format": fmt, "playlist": playlist})

        if not items:
            return jsonify({"error": "Keine gültigen URLs übergeben."}), 400

        ytdlp_info = ensure_ytdlp_fresh()

        task_id = uuid.uuid4().hex
        TASK_QUEUES[task_id] = queue.Queue()
        TASK_STATE[task_id] = [
            {"url": it["url"], "format": it["format"], "status": "queued", "percent": 0}
            for it in items
        ]
        threading.Thread(target=run_task, args=(task_id, items), daemon=True).start()
        return jsonify({
            "task_id": task_id,
            "items": TASK_STATE[task_id],
            "ytdlp": ytdlp_info,
        })

    @app.get("/api/info")
    def api_info():
        url = (request.args.get("url") or "").strip()
        if not url:
            return jsonify({"error": "Kein URL-Parameter übergeben."}), 400
        try:
            data = extract_video_info(url)
            if not data:
                return jsonify({"error": "Keine Infos gefunden."}), 404
            return jsonify(data)
        except Exception as e:  # noqa: BLE001
            return jsonify({"error": str(e)}), 500

    @app.post("/api/cancel/<task_id>")
    def api_cancel(task_id: str):
        if cancel_task(task_id):
            return jsonify({"status": "cancelled"})
        return jsonify({"error": "Unbekannte task_id"}), 404

    @app.route("/api/progress/<task_id>")
    def api_progress(task_id: str):
        if task_id not in TASK_QUEUES:
            return jsonify({"error": "Unbekannte task_id"}), 404

        def stream():
            q = TASK_QUEUES[task_id]
            for idx, st in enumerate(TASK_STATE[task_id]):
                yield f"data: {json.dumps({'index': idx, **st})}\n\n"
            while True:
                try:
                    msg = q.get(timeout=30)
                except queue.Empty:
                    yield ": keep-alive\n\n"
                    continue
                if msg.get("event") == "complete":
                    yield f"data: {json.dumps({'event': 'complete'})}\n\n"
                    break
                yield f"data: {json.dumps(msg)}\n\n"

            def cleanup():
                time.sleep(60)
                TASK_QUEUES.pop(task_id, None)
                TASK_STATE.pop(task_id, None)
            threading.Thread(target=cleanup, daemon=True).start()

        return Response(stream(), mimetype="text/event-stream")
