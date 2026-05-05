"""Konfiguration und Konstanten."""
import importlib
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# yt-dlp Auto-Update
# ---------------------------------------------------------------------------
def check_and_update_ytdlp() -> dict:
    """Prüft, ob yt-dlp veraltet ist (>30 Tage) und aktualisiert ggf."""
    import yt_dlp

    info = {"current": yt_dlp.version.__version__, "updated": False, "error": None}
    try:
        version_date = datetime.strptime(info["current"], "%Y.%m.%d")
        if datetime.now() - version_date > timedelta(days=30):
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


YTDLP_STATUS = check_and_update_ytdlp()

# ---------------------------------------------------------------------------
# Konstanten
# ---------------------------------------------------------------------------
DOWNLOAD_DIR = str(Path.home() / "Downloads")
AUDIO_FORMATS = {"mp3", "m4a", "aac", "flac", "opus", "wav"}
VIDEO_FORMATS = {"mp4", "mkv", "webm"}
ALL_FORMATS = AUDIO_FORMATS | VIDEO_FORMATS
MAX_CONCURRENT = 3
