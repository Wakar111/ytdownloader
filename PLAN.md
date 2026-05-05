# YouTube Video Downloader – Webanwendung

Eine responsive Webanwendung (Flask + yt-dlp), mit der man ein oder mehrere YouTube-Videos gleichzeitig in verschiedenen Formaten (mp3, mp4, mkv, etc.) herunterladen kann.

---

## Technologie-Stack

| Komponente | Technologie | Begründung |
|---|---|---|
| **Backend** | Python 3.10+, Flask | Leichtgewichtig, einfach, bewährt für kleine Web-Apps |
| **Download-Engine** | [yt-dlp](https://github.com/yt-dlp/yt-dlp) | Aktivster YouTube-Downloader, Python-API, unterstützt alle Formate |
| **Audio/Video-Konvertierung** | ffmpeg (Systemabhängigkeit) | Wird von yt-dlp benötigt für Format-Konvertierung (mp3, mkv, etc.) |
| **Frontend** | HTML + TailwindCSS (CDN) + Vanilla JS | Mobile-first, modern, keine Build-Tools nötig |
| **Fortschritt** | Server-Sent Events (SSE) | Echtzeit-Progress ohne WebSocket-Komplexität |

## Python-Packages

```
flask>=3.0
yt-dlp>=2024.0
```

**Systemabhängigkeit:** `ffmpeg` muss auf dem System installiert sein (`brew install ffmpeg` auf macOS).

## Unterstützte Formate

- **Video:** mp4, mkv, webm
- **Audio:** mp3, m4a, aac, flac, opus, wav

---

## Architektur-Übersicht

```
ytdownloader/
├── app.py                  # Flask-App: Routen, Download-Logik, SSE
├── templates/
│   └── index.html          # Frontend: UI mit TailwindCSS
├── static/
│   └── app.js              # Frontend-Logik: dynamische Felder, SSE-Client
├── requirements.txt        # Python-Abhängigkeiten
└── README.md               # Setup-Anleitung
```

---

## Features

### 1. Eingabefelder & UI
- Ein Eingabefeld für YouTube-URL + ein Format-Dropdown daneben
- **+ Button** fügt ein weiteres URL/Format-Paar hinzu (dynamisch per JS)
- **× Button** zum Entfernen einzelner Einträge
- **"Alle herunterladen"**-Button startet den Download aller eingetragenen Videos
- Mobile-responsive Layout (TailwindCSS)

### 2. Format-Auswahl (pro Video)
- Dropdown mit Optionen: `mp4`, `mkv`, `webm`, `mp3`, `m4a`, `aac`, `flac`, `opus`, `wav`
- Audio-Formate nutzen `FFmpegExtractAudio` PostProcessor
- Video-Formate nutzen `merge_output_format` für die finale Container-Wahl

### 3. Download-Logik (Backend)
- **Endpunkt `POST /api/download`**: Nimmt Liste von `{url, format}` Objekten entgegen
- Nutzt yt-dlp Python-API (eingebettet)
- **Download-Ziel:** immer `~/Downloads/`
- Dateiname-Template: `%(title)s.%(ext)s`
- Threading für parallele Downloads

### 4. Fortschrittsanzeige
- SSE-Endpunkt `GET /api/progress/<task_id>` streamt den Fortschritt
- Pro Video: Prozent-Balken, Status (wartet / lädt / konvertiert / fertig / Fehler)
- yt-dlp `progress_hooks` liefern Download-Prozent in Echtzeit

### 5. Auto-Update von yt-dlp
- Beim **App-Start** wird automatisch geprüft, ob yt-dlp veraltet ist
- yt-dlp Versionen sind als Datum benannt (z.B. `2025.04.30`)
- Wenn die Version **älter als 30 Tage** ist → automatisch `pip install --upgrade yt-dlp`
- Update läuft beim Start, App startet auch bei fehlgeschlagenem Update
- Status wird in der UI angezeigt (aktualisiert / aktuell / Fehler)

### 6. Fehlerbehandlung
- Ungültige URLs → Fehlermeldung im UI
- Nicht verfügbare Videos → individueller Fehler pro Eintrag
- ffmpeg fehlt → Fehler bei der Konvertierung wird im UI angezeigt
- yt-dlp Update fehlgeschlagen → Warnung, aber App läuft weiter
