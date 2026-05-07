/** Main app – form rows, submit handler, SSE. */

import { $, $$, isValidYouTubeUrl } from './utils.js';
import './theme.js';
import { showToast } from './toast.js';
import { validateUrlInput } from './validation.js';
import { showProgressSection, hideProgressSection, renderProgressItems, updateProgressItem, getStates } from './progress.js';
import { saveSession, loadSession, clearSession } from './session.js';

const itemsContainer = $('#items-container');
const itemTpl = $('#item-template');
const addBtn = $('#add-btn');
const form = $('#download-form');
const submitBtn = $('#submit-btn');
const submitIcon = $('#submit-icon');
const submitSpinner = $('#submit-spinner');
const submitText = $('#submit-text');
const cancelBtn = $('#cancel-btn');

let activeTaskId = null;
let activeES = null;

// ── Auto-save helper ──
function autoSave() { saveSession(itemsContainer); }

// ── Item rows ──
function addItemRow(data) {
  const node = itemTpl.content.firstElementChild.cloneNode(true);
  const input = $('input[name="url"]', node);
  const select = $('select[name="format"]', node);
  const playlistCb = $('input[name="playlist"]', node);

  if (data) {
    input.value = data.url || '';
    select.value = data.format || 'mp3';
    if (playlistCb) playlistCb.checked = !!data.playlist;
  }

  input.addEventListener('input', () => { validateUrlInput(input, node); autoSave(); });
  input.addEventListener('paste', () => setTimeout(() => { validateUrlInput(input, node); autoSave(); }, 50));
  select.addEventListener('change', autoSave);
  if (playlistCb) playlistCb.addEventListener('change', autoSave);

  $('.remove-btn', node).addEventListener('click', () => {
    if (itemsContainer.children.length > 1) {
      node.classList.add('removing');
      node.addEventListener('animationend', () => { node.remove(); autoSave(); });
    } else {
      input.value = '';
      validateUrlInput(input, node);
      autoSave();
    }
  });

  itemsContainer.appendChild(node);
  if (data?.url) validateUrlInput(input, node);
  else input.focus();
}

addBtn.addEventListener('click', () => { addItemRow(); autoSave(); });

// ── Restore session ──
const saved = loadSession();
if (saved && saved.length) {
  saved.forEach((item) => addItemRow(item));
} else {
  addItemRow();
}

// ── Submit state ──
function setLoading(on) {
  submitBtn.disabled = on;
  submitIcon.classList.toggle('hidden', on);
  submitSpinner.classList.toggle('hidden', !on);
  submitText.textContent = on ? 'Downloads laufen ...' : 'Alle herunterladen';
  submitBtn.classList.toggle('glow-red', !on);
}

// ── Form submit ──
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const rows = $$('.item-row', itemsContainer);
  const items = [];
  let hasInvalid = false;

  const seen = new Set();
  let dupeCount = 0;

  rows.forEach((r) => {
    const url = $('input[name="url"]', r).value.trim();
    const fmt = $('select[name="format"]', r).value;
    const playlist = $('input[name="playlist"]', r)?.checked || false;
    if (!url) return;
    if (!isValidYouTubeUrl(url)) { hasInvalid = true; return; }
    const key = `${url}|${fmt}`;
    if (seen.has(key)) { dupeCount++; return; }
    seen.add(key);
    items.push({ url, format: fmt, playlist });
  });

  if (hasInvalid && !items.length) {
    showToast('error', 'Ungültige URLs', 'Bitte gültige YouTube-URLs eingeben.');
    return;
  }
  if (!items.length) {
    showToast('warning', 'Keine URLs', 'Bitte mindestens eine YouTube-URL eingeben.');
    return;
  }
  if (dupeCount) {
    showToast('info', 'Duplikate entfernt', `${dupeCount} doppelte URL(s) wurden übersprungen.`);
  }
  if (hasInvalid) {
    showToast('warning', 'Hinweis', `${items.length} gültige URLs werden heruntergeladen. Ungültige wurden übersprungen.`);
  }

  setLoading(true);
  cancelBtn.classList.remove('hidden');
  showToast('info', 'Download beginnt in Kürze ...', 'Pakete werden geprüft.');

  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    activeTaskId = data.task_id;
    if (data.ytdlp?.updated) {
      showToast('success', 'yt-dlp aktualisiert', `Neue Version: ${data.ytdlp.version}`);
    }
    showProgressSection();
    renderProgressItems(data.items);
    showToast('info', 'Downloads gestartet', `${data.items.length} Video(s) werden heruntergeladen.`);

    const es = new EventSource(`/api/progress/${data.task_id}`);
    activeES = es;
    es.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.event === 'complete') {
        es.close();
        activeES = null;
        activeTaskId = null;
        setLoading(false);
        cancelBtn.classList.add('hidden');
        const st = getStates();
        const errors = st.filter(s => s.status === 'error').length;
        const done = st.filter(s => s.status === 'done').length;
        const cancelled = st.filter(s => s.status === 'cancelled').length;
        if (cancelled > 0) {
          showToast('info', 'Abgebrochen', `${done} fertig, ${cancelled} abgebrochen.`);
        } else if (errors === 0) {
          showToast('success', 'Fertig!', `${done} Video(s) erfolgreich heruntergeladen.`);
          hideProgressSection(5000);
        } else {
          showToast('warning', 'Teilweise fertig', `${done} erfolgreich, ${errors} fehlgeschlagen.`);
        }
        return;
      }
      updateProgressItem(msg);
    };
    es.onerror = () => {
      es.close();
      activeES = null;
      activeTaskId = null;
      setLoading(false);
      cancelBtn.classList.add('hidden');
      showToast('error', 'Verbindung verloren', 'SSE-Verbindung zum Server unterbrochen.');
    };
  } catch (err) {
    showToast('error', 'Fehler', err.message);
    setLoading(false);
    cancelBtn.classList.add('hidden');
  }
});

// ── Cancel ──
cancelBtn.addEventListener('click', async () => {
  if (!activeTaskId) return;
  cancelBtn.disabled = true;
  cancelBtn.textContent = 'Wird abgebrochen...';
  try {
    await fetch(`/api/cancel/${activeTaskId}`, { method: 'POST' });
  } catch { /* ignore */ }
});
