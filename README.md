# YouTube Downloader

Eine responsive Web-App (Flask + yt-dlp) zum Herunterladen von YouTube-Videos in verschiedenen Formaten (mp3, mp4, mkv, etc.). Mehrere URLs können gleichzeitig verarbeitet werden. Downloads landen immer im Ordner `~/Downloads`.

## Features

- Mehrere YouTube-URLs gleichzeitig downloaden
- Format-Auswahl pro Video: `mp4`, `mkv`, `webm`, `mp3`, `m4a`, `flac`, `wav`
- Echtzeit-Fortschrittsanzeige (Server-Sent Events)
- Mobile-responsive UI (TailwindCSS)
- Auto-Update für yt-dlp beim Start (wenn älter als 30 Tage)

## Voraussetzungen

- **Python 3.10+**
- **ffmpeg** (für Format-Konvertierung)
  ```bash
  brew install ffmpeg     # macOS
  sudo apt install ffmpeg # Ubuntu/Debian
  ```

## Installation

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Starten

```bash
python app.py
```

Dann im Browser öffnen: http://localhost:5001

Auf dem Handy im selben WLAN: `http://<deine-mac-ip>:5001`

## Hinweis zur yt-dlp Wartung

YouTube ändert regelmäßig seine API. Die App führt beim Start automatisch ein Update von `yt-dlp` durch, wenn die installierte Version älter als 30 Tage ist. Falls Downloads dennoch fehlschlagen, manuell aktualisieren:

```bash
pip install --upgrade yt-dlp
```

## Was diese App besonders macht

- **Dark / Light Mode** — Augenschonend arbeiten, egal ob Tag oder Nacht. Dein Theme wird gespeichert und beim nächsten Besuch automatisch geladen.
- **Duplikat-Erkennung** — Gleiche URL + gleiches Format wird automatisch erkannt und übersprungen. Bereits heruntergeladene Dateien werden nicht erneut überschrieben.
- **Playlist-Support** — Ganze YouTube-Playlists mit einem Klick herunterladen. Einfach Checkbox aktivieren und Playlist-URL einfügen.
- **Thumbnail-Vorschau** — Sieh direkt beim Einfügen der URL das Video-Thumbnail, den Titel, die Dauer und den Uploader.
- **Parallele Downloads mit Warteschlange** — Bis zu 3 Videos gleichzeitig herunterladen. Weitere warten automatisch in der Queue.
- **Echtzeit-Fortschritt** — Geschwindigkeit, ETA und Prozent live für jeden einzelnen Download.
- **Session-Persistenz** — Seite aktualisiert? Kein Problem. Alle eingegebenen URLs, Formate und Einstellungen bleiben erhalten.
- **9 Formate** — Audio (MP3, AAC, FLAC, M4A, OPUS, WAV) und Video (MP4, MKV, WEBM) pro Download wählbar.
- **Auto-Update** — yt-dlp wird beim Start automatisch aktualisiert, damit Downloads nicht an veralteten APIs scheitern.
- **Mobile-ready** — Funktioniert im Handy-Browser über das lokale WLAN genauso gut wie am Desktop.

## Beispiel Links:
https://youtu.be/Ej6BjRFRYks?si=3hlwjMOWkXTQJ68Q
https://youtu.be/lJZ8wWCnwow?si=AdiVcWPBCj2M0RBh
https://youtu.be/Ej6BjRFRYks?si=B0YKNbEHFlpYe5Jf
https://youtu.be/z-rtUUAjDK0?si=bgt2V0M-SuQZ8gJz
https://youtu.be/E7ergOnpO1Q?si=CHtzhjPC9oFGliOX