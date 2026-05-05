/** DOM helpers and utility functions. */

export const $ = (s, p) => (p || document).querySelector(s);
export const $$ = (s, p) => (p || document).querySelectorAll(s);

export function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// ── YouTube URL patterns ──
const YT_VIDEO = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/;
const YT_PLAYLIST = /^(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/(?:playlist\?list=|watch\?.*list=)([\w-]+)/;

export function extractVideoId(url) {
  const m = url.match(YT_VIDEO);
  return m ? m[1] : null;
}

export function isValidYouTubeUrl(url) {
  return YT_VIDEO.test(url) || YT_PLAYLIST.test(url);
}

export function getThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ── Formatters ──
export function formatDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '';
  if (bytesPerSec > 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec.toFixed(0)} B/s`;
}

export function formatEta(seconds) {
  if (!seconds || seconds <= 0) return '';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}
