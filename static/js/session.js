/** Persist form state in sessionStorage across page reloads. */

import { $ } from './utils.js';

const KEY = 'yt-dl-session';

export function saveSession(container) {
  const rows = container.querySelectorAll('.item-row');
  const items = [];
  rows.forEach((r) => {
    const url = $('input[name="url"]', r)?.value || '';
    const format = $('select[name="format"]', r)?.value || 'mp3';
    const playlist = $('input[name="playlist"]', r)?.checked || false;
    items.push({ url, format, playlist });
  });
  sessionStorage.setItem(KEY, JSON.stringify(items));
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
