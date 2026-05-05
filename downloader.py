"""yt-dlp Download-Logik und Task-Management."""
import os
import queue
import threading

import yt_dlp

from config import AUDIO_FORMATS, DOWNLOAD_DIR, MAX_CONCURRENT, VIDEO_FORMATS

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
DOWNLOAD_SEM = threading.Semaphore(MAX_CONCURRENT)
TASK_QUEUES: dict[str, queue.Queue] = {}
TASK_STATE: dict[str, list[dict]] = {}
TASK_CANCELLED: dict[str, bool] = {}


# ---------------------------------------------------------------------------
# yt-dlp Optionen
# ---------------------------------------------------------------------------
def build_ydl_opts(fmt: str, progress_hook, playlist: bool = False) -> dict:
    base = {
        "outtmpl": os.path.join(DOWNLOAD_DIR, "%(title)s.%(ext)s"),
        "noplaylist": not playlist,
        "progress_hooks": [progress_hook],
        "quiet": True,
        "no_warnings": True,
        "overwrites": False,
    }
    if fmt in AUDIO_FORMATS:
        base["format"] = "bestaudio/best"
        base["postprocessors"] = [
            {"key": "FFmpegExtractAudio", "preferredcodec": fmt, "preferredquality": "192"}
        ]
    elif fmt in VIDEO_FORMATS:
        base["format"] = f"bestvideo[ext={fmt}]+bestaudio/bestvideo+bestaudio/best"
        base["merge_output_format"] = fmt
    else:
        raise ValueError(f"Unbekanntes Format: {fmt}")
    return base


# ---------------------------------------------------------------------------
# SSE Push
# ---------------------------------------------------------------------------
def push_update(task_id: str, idx: int, **changes) -> None:
    state = TASK_STATE[task_id][idx]
    state.update(changes)
    q = TASK_QUEUES.get(task_id)
    if q is not None:
        q.put({"index": idx, **state})


# ---------------------------------------------------------------------------
# Download Worker
# ---------------------------------------------------------------------------
class CancelledError(Exception):
    """Raised when a task is cancelled."""


def download_one(task_id: str, idx: int, url: str, fmt: str, playlist: bool = False) -> None:
    if TASK_CANCELLED.get(task_id):
        push_update(task_id, idx, status="cancelled", percent=0)
        return

    push_update(task_id, idx, status="queued", percent=0)
    DOWNLOAD_SEM.acquire()

    if TASK_CANCELLED.get(task_id):
        DOWNLOAD_SEM.release()
        push_update(task_id, idx, status="cancelled", percent=0)
        return

    push_update(task_id, idx, status="starting", percent=0)

    def hook(d):
        if TASK_CANCELLED.get(task_id):
            raise CancelledError("Download abgebrochen")
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes") or 0
            percent = (downloaded / total * 100) if total else 0
            push_update(task_id, idx, status="downloading",
                        percent=round(percent, 1),
                        speed=d.get("speed") or 0,
                        eta=d.get("eta") or 0)
        elif d.get("status") == "finished":
            push_update(task_id, idx, status="processing", percent=100,
                        filename=os.path.basename(d.get("filename", "")))

    try:
        opts = build_ydl_opts(fmt, hook, playlist=playlist)
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get("title") if isinstance(info, dict) else None
        push_update(task_id, idx, status="done", percent=100, title=title)
    except CancelledError:
        push_update(task_id, idx, status="cancelled", percent=0)
    except Exception as e:  # noqa: BLE001
        if TASK_CANCELLED.get(task_id):
            push_update(task_id, idx, status="cancelled", percent=0)
        else:
            push_update(task_id, idx, status="error", error=str(e))
    finally:
        DOWNLOAD_SEM.release()


def run_task(task_id: str, items: list[dict]) -> None:
    TASK_CANCELLED[task_id] = False
    threads = []
    for idx, item in enumerate(items):
        t = threading.Thread(
            target=download_one,
            args=(task_id, idx, item["url"], item["format"], item.get("playlist", False)),
            daemon=True,
        )
        threads.append(t)
        t.start()
    for t in threads:
        t.join()
    q = TASK_QUEUES.get(task_id)
    if q is not None:
        q.put({"event": "complete"})


def cancel_task(task_id: str) -> bool:
    if task_id not in TASK_STATE:
        return False
    TASK_CANCELLED[task_id] = True
    for idx, st in enumerate(TASK_STATE[task_id]):
        if st["status"] in ("queued", "starting"):
            push_update(task_id, idx, status="cancelled", percent=0)
    return True


# ---------------------------------------------------------------------------
# Video Info (ohne Download)
# ---------------------------------------------------------------------------
def extract_video_info(url: str) -> dict:
    opts = {"quiet": True, "no_warnings": True, "skip_download": True, "noplaylist": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=False)
    if info is None:
        return {}
    return {
        "title": info.get("title"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
        "uploader": info.get("uploader"),
        "view_count": info.get("view_count"),
        "is_playlist": info.get("_type") == "playlist",
        "playlist_count": info.get("playlist_count"),
    }
