"""Konfiguration und Konstanten."""
import importlib
import subprocess
import sys
import threading
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# yt-dlp Auto-Update
# ---------------------------------------------------------------------------
CHECK_FILE = Path(__file__).parent / ".ytdlp_last_check"
CHECK_INTERVAL = timedelta(hours=24)
STALE_AFTER = timedelta(days=30)
_update_lock = threading.Lock()


def _read_last_check() -> datetime | None:
    if not CHECK_FILE.exists():
        return None
    try:
        return datetime.fromisoformat(CHECK_FILE.read_text().strip())
    except Exception:  # noqa: BLE001
        return None


def _write_last_check() -> None:
    try:
        CHECK_FILE.write_text(datetime.now().isoformat())
    except Exception as e:  # noqa: BLE001
        print(f"[yt-dlp] Konnte Zeitstempel nicht speichern: {e}")


def check_and_update_ytdlp() -> dict:
    """Prüft, ob yt-dlp veraltet ist (>30 Tage) und aktualisiert ggf."""
    import yt_dlp

    info = {"current": yt_dlp.version.__version__, "updated": False, "error": None}
    try:
        version_date = datetime.strptime(info["current"], "%Y.%m.%d")
        if datetime.now() - version_date > STALE_AFTER:
            print(f"[yt-dlp] Version {info['current']} ist veraltet, aktualisiere ...")
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"],
                check=True,
            )
            importlib.reload(yt_dlp)
            info["current"] = yt_dlp.version.__version__
            info["updated"] = True
            print(f"[yt-dlp] Aktualisiert auf {info['current']}")
        else:
            print(f"[yt-dlp] Version {info['current']} ist aktuell genug.")
    except Exception as e:  # noqa: BLE001
        info["error"] = str(e)
        print(f"[yt-dlp] Auto-Update fehlgeschlagen: {e}")
    return info


def ensure_ytdlp_fresh() -> dict:
    """Synchroner Check vor jedem Download.

    Prüft höchstens 1x pro 24h ob yt-dlp aktualisiert werden muss.
    Lock verhindert dass parallele Requests gleichzeitig 'pip install' ausführen.

    Returns:
        dict mit Keys: 'checked' (bool), 'updated' (bool), 'version' (str), 'error' (str|None)
    """
    import yt_dlp

    result = {
        "checked": False,
        "updated": False,
        "version": yt_dlp.version.__version__,
        "error": None,
    }

    last = _read_last_check()
    if last and datetime.now() - last < CHECK_INTERVAL:
        return result

    with _update_lock:
        # Nach Acquire erneut prüfen: ein anderer Thread hat vielleicht gerade aktualisiert
        last = _read_last_check()
        if last and datetime.now() - last < CHECK_INTERVAL:
            result["version"] = yt_dlp.version.__version__
            return result

        info = check_and_update_ytdlp()
        _write_last_check()
        result["checked"] = True
        result["updated"] = info["updated"]
        result["version"] = info["current"]
        result["error"] = info["error"]

    return result


# Beim App-Start einmalig prüfen und Zeitstempel setzen
YTDLP_STATUS = check_and_update_ytdlp()
_write_last_check()

# ---------------------------------------------------------------------------
# Konstanten
# ---------------------------------------------------------------------------
DOWNLOAD_DIR = str(Path.home() / "Downloads")
AUDIO_FORMATS = {"mp3", "m4a", "aac", "flac", "opus", "wav"}
VIDEO_FORMATS = {"mp4", "mkv", "webm"}
ALL_FORMATS = AUDIO_FORMATS | VIDEO_FORMATS
MAX_CONCURRENT = 3
