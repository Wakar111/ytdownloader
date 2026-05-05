# YouTube Downloader – Projekt-Kontext

Flask + yt-dlp Web-App zum Herunterladen von YouTube-Videos und -Playlists in verschiedenen Formaten.

## Clean Code Guidelines

Bei **jeder neuen Implementierung** diese Regeln einhalten:

### Modulare Trennung
- **Eine Datei = eine Verantwortung.** Neue Features gehören in eigene Module, nicht in bestehende reingestopft.
- **Backend:** Neue Logik in eigene `.py`-Datei → in `routes.py` einbinden. Keine Business-Logik in Routes.
- **Frontend JS:** Neues Feature = neue Datei unter `static/js/` → in `app.js` importieren.
- **Frontend CSS:** Neue Styles in `static/css/style.css` ergänzen, **niemals** inline in HTML.

### Abhängigkeiten
- Importe immer am Dateianfang, nie mitten im Code.
- Zirkuläre Imports vermeiden: `config.py` → `downloader.py` → `routes.py` → `app.py` (Einbahnstraße).
- Frontend: `utils.js` importiert nichts aus anderen Modulen (Basis-Layer).

### Funktionen & Benennung
- Funktionen klein halten (<30 Zeilen). Tut eine Funktion zwei Dinge → aufteilen.
- Sprechende Namen: `build_ydl_opts()`, nicht `make_opts()`. `validateUrlInput()`, nicht `check()`.
- Keine Magic Numbers – Konstanten in `config.py` (Backend) oder am Dateianfang (Frontend).

### State & Seiteneffekte
- Backend-State (`TASK_QUEUES`, `TASK_STATE`) lebt zentral in `downloader.py`.
- Frontend-State pro Modul kapseln. Zugriff von außen nur über exportierte Funktionen (z.B. `getStates()`).
- DOM-Manipulation nur im zuständigen Modul (Progress-DOM nur in `progress.js`).

### Theming & Styles
- Alle Farben über CSS-Variablen (`--bg`, `--text`, etc.) – keine hardcoded Farben für theme-relevante Elemente.
- Light-Mode-Overrides gesammelt am Ende von `style.css` unter `[data-theme="light"]`.
- TailwindCSS-Klassen im HTML, Custom-Styles in CSS-Datei. Nicht mischen.
- **Tailwind Arbitrary Opacity:** Immer mit führender Null schreiben (`bg-white/[0.06]`, **nicht** `bg-white/[.06]`). Der v3-CLI-Scanner erkennt sonst die Klasse nicht.
- Nach Tailwind-Klassenänderungen in HTML/JS: `npm run build:css` ausführen.
- Light-Mode-Overrides in `style.css` müssen die exakten Klassennamen escapen (z.B. `.bg-white\/\[0\.06\]`).

### Checkliste für neue Features
1. Braucht es eine neue Datei? → Erstellen, nicht in bestehende quetschen.
2. Backend-Logik in `downloader.py` oder neues Modul, Route in `routes.py`.
3. Frontend: JS-Modul erstellen, in `app.js` importieren, CSS in `style.css`.
4. Keine Inline-Styles, kein Inline-JS in HTML.
5. Exportierte Funktionen dokumentieren (kurzer JSDoc / Docstring).

## Architektur

- **Backend:** Python Flask, Port 5001, modularer Aufbau
- **Download-Engine:** yt-dlp (Python-API, eingebettet, NICHT CLI)
- **Frontend:** HTML + TailwindCSS v3 (lokaler Build, **kein CDN**) + Vanilla JS (ES Modules)
- **Kommunikation:** REST API + Server-Sent Events (SSE) für Echtzeit-Fortschritt
- **Parallele Downloads:** Python `threading` + `Semaphore` (max. 3 gleichzeitig)
- **Cancel-Mechanismus:** `TASK_CANCELLED` Flag + `CancelledError` im yt-dlp Progress-Hook

## Projektstruktur

### Backend (Python)

| Datei | Zweck |
|---|---|
| `app.py` | Entrypoint – Flask-App erstellen, Routes registrieren, Server starten |
| `config.py` | Konstanten (`DOWNLOAD_DIR`, Formate, `MAX_CONCURRENT`), yt-dlp Auto-Update |
| `downloader.py` | yt-dlp Logik: `build_ydl_opts()`, `download_one()`, `run_task()`, `cancel_task()`, `extract_video_info()` |
| `routes.py` | Alle Flask-Routes via `register_routes(app)` |

### Frontend (HTML / CSS / JS)

| Datei | Zweck |
|---|---|
| `templates/index.html` | HTML-Struktur + Templates (kein Inline-CSS/JS) |
| `static/css/tailwind-input.css` | Tailwind-Input mit `@tailwind base/components/utilities` |
| `static/css/tailwind.css` | **Generiert** via `npm run build:css` (nicht manuell editieren) |
| `static/css/style.css` | Custom Styles: CSS-Variablen, Glassmorphism, Animationen, Light/Dark-Mode-Overrides |
| `static/js/app.js` | Main-Modul: Form-Rows, Submit-Handler, SSE-Client, Cancel-Logik |
| `static/js/utils.js` | DOM-Helfer (`$`, `$$`), YouTube-URL-Regex, Formatter |
| `static/js/theme.js` | Dark/Light-Mode Toggle mit `localStorage` |
| `static/js/toast.js` | Toast-Notification-System |
| `static/js/validation.js` | URL-Validierung + Video-Info-Fetch via `/api/info` |
| `static/js/progress.js` | Fortschrittsanzeige, Status-Badges, Overall-Bar, `hideProgressSection()` |
| `static/js/session.js` | `sessionStorage`-Persistenz für Form-State (URLs, Format, Playlist) |

### Sonstige

| Datei | Zweck |
|---|---|
| `requirements.txt` | `flask>=3.0`, `yt-dlp>=2024.0` |
| `package.json` | Tailwind v3 + Build-Scripts (`build:css`, `watch:css`) |
| `tailwind.config.js` | Tailwind-Theme: Brand-Farben, Inter-Font, Animationen, Content-Pfade |
| `README.md` | Setup-Anleitung + Benefits-Section |
| `.gitignore` | `node_modules/`, `__pycache__/`, `venv/` |

## Features

- Mehrere YouTube-URLs gleichzeitig herunterladen
- **Playlist-Support:** Checkbox pro Zeile, lädt alle Videos einer Playlist
- Format-Auswahl **pro Video**: Audio (MP3, AAC, FLAC, M4A, OPUS, WAV) und Video (MP4, MKV, WEBM)
- **Default-Format:** MP3 (Audio zuerst im Dropdown)
- **Thumbnail-Vorschau** + Video-Info (Titel, Dauer, Uploader) via `/api/info`
- **Warteschlange:** Max. 3 gleichzeitige Downloads (Semaphore)
- **Dark/Light-Mode:** Toggle oben rechts, persistiert in `localStorage`
- **Echtzeit-Fortschritt:** Speed, ETA, Prozent per SSE
- **Toast-Notifications:** Erfolg, Fehler, Warnungen
- **Cancel-Funktion:** Laufende Downloads via Button abbrechbar (Backend-Flag stoppt yt-dlp im Hook)
- **Duplikat-Erkennung:** Gleiche URL + Format wird im Frontend gefiltert; Backend `overwrites=False` verhindert erneutes Schreiben
- **Session-Persistenz:** Form-State (URLs, Format, Playlist) bleibt bei Page-Reload erhalten (`sessionStorage`)
- **Auto-Hide:** Downloads-Section verschwindet 5s nach erfolgreichem Abschluss
- Download-Ziel: **immer `~/Downloads/`** (hardcoded in `config.py`)
- Auto-Update: yt-dlp wird beim Start aktualisiert wenn >30 Tage alt
- Info-Karten mit Nutzungshinweisen + Benefits-Section auf der Hauptseite
- Erstellt von Innovative-Tech (Footer-Link)

## API-Endpunkte

| Route | Methode | Zweck |
|---|---|---|
| `/` | GET | Hauptseite |
| `/api/download` | POST | Startet Download-Jobs, gibt `task_id` zurück |
| `/api/info?url=` | GET | Video-Metadaten (Titel, Thumbnail, Dauer) ohne Download |
| `/api/progress/<task_id>` | GET (SSE) | Echtzeit-Fortschritts-Stream |
| `/api/cancel/<task_id>` | POST | Bricht laufenden Task ab (setzt `TASK_CANCELLED` Flag) |

## Code-Konventionen

### Backend
- **Modulare Trennung:** Config → Downloader → Routes → App (Entrypoint)
- yt-dlp Optionen via `build_ydl_opts(fmt, hook, playlist)` mit `overwrites=False`
- Audio: `format='bestaudio/best'` + `FFmpegExtractAudio` PostProcessor
- Video: `format='bestvideo+bestaudio/best'` + `merge_output_format`
- Semaphore limitiert parallele Downloads auf `MAX_CONCURRENT`
- State: `TASK_QUEUES`, `TASK_STATE`, `TASK_CANCELLED` zentral in `downloader.py`
- Cancel: `CancelledError` wird im Progress-Hook geworfen, sobald Flag gesetzt ist
- Cleanup nach 60s Verzögerung nach Task-Abschluss
- Status-Werte: `queued`, `starting`, `downloading`, `processing`, `done`, `error`, `cancelled`

### Frontend
- **ES Modules:** Alle JS-Dateien nutzen `import`/`export`, geladen via `<script type="module">`
- **CSS-Variablen** für Theming (`--bg`, `--text`, `--surface`, `--border`, etc.)
- **Kein Inline-CSS/JS** in `index.html` – alles in separaten Dateien
- DOM-Queries über `$()` / `$$()` Helfer aus `utils.js`
- Debounced API-Calls für Video-Info (600ms)
- Info-Cache verhindert doppelte `/api/info`-Requests
- Auto-Save bei jeder Form-Änderung (Input, Format-Wechsel, Playlist-Toggle, Add/Remove Row)
- Cancel-Button im Progress-Section sichtbar während aktivem Task

## Starten

### Erstmalige Einrichtung

```bash
# Python
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Tailwind CSS bauen (einmalig + bei jeder Klassenänderung)
npm install
npm run build:css
```

### Server starten

```bash
source venv/bin/activate
python app.py
```

Erreichbar auf:
- http://localhost:5001
- http://<lokale-ip>:5001 (Handy im selben WLAN)

Flask debug=True ist aktiv → Auto-Reload bei Python-Änderungen.

### CSS während der Entwicklung

```bash
npm run watch:css   # Auto-Rebuild bei HTML/JS-Änderungen
```

## Voraussetzungen

- Python 3.10+
- Node.js 18+ (nur für Tailwind-Build, läuft nicht zur Laufzeit)
- ffmpeg installiert (`brew install ffmpeg`)
- venv mit `flask` und `yt-dlp`
