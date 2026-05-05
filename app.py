"""YouTube Downloader Web-App – Entrypoint."""
import os

from flask import Flask

from config import DOWNLOAD_DIR
from routes import register_routes

app = Flask(__name__)
register_routes(app)

if __name__ == "__main__":
    os.makedirs(DOWNLOAD_DIR, exist_ok=True)
    print(f"[app] Download-Ordner: {DOWNLOAD_DIR}")
    app.run(host="0.0.0.0", port=5001, debug=True, threaded=True)
