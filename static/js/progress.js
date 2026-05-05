/** Progress tracking and rendering. */

import { $, extractVideoId, getThumbnailUrl, formatSpeed, formatEta } from './utils.js';

const progressSection = $('#progress-section');
const progressList = $('#progress-list');
const overallBar = $('#overall-bar');
const overallCount = $('#overall-count');
const progressTpl = $('#progress-template');

let states = [];

const STATUS_BADGE = {
  queued: 'bg-white/[0.06] text-slate-400',
  starting: 'bg-blue-500/15 text-blue-400',
  downloading: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-amber-500/15 text-amber-400',
  done: 'bg-emerald-500/15 text-emerald-400',
  error: 'bg-rose-500/15 text-rose-400',
  cancelled: 'bg-orange-500/15 text-orange-400',
};

const STATUS_LABEL = {
  queued: 'wartet', starting: 'startet', downloading: 'download',
  processing: 'konvertiert', done: 'fertig', error: 'fehler',
  cancelled: 'abgebrochen',
};

function updateOverall() {
  if (!states.length) return;
  const done = states.filter(s => s.status === 'done').length;
  const errored = states.filter(s => s.status === 'error').length;
  const cancelled = states.filter(s => s.status === 'cancelled').length;
  const total = states.length;
  const avg = states.reduce((a, s) => a + (s.percent || 0), 0) / total;
  overallBar.style.width = `${avg}%`;
  let label = `${done}/${total} fertig`;
  if (errored) label += ` (${errored} Fehler)`;
  if (cancelled) label += ` (${cancelled} abgebrochen)`;
  overallCount.textContent = label;
  if (done + errored + cancelled === total) {
    overallBar.classList.remove('from-red-500', 'to-rose-400');
    overallBar.classList.add('from-emerald-500', 'to-emerald-400');
  }
}

export function showProgressSection() {
  progressSection.classList.remove('hidden');
  progressSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function hideProgressSection(delayMs = 5000) {
  setTimeout(() => {
    progressSection.classList.add('hidden');
    progressList.innerHTML = '';
    states = [];
    overallBar.style.width = '0%';
    overallBar.classList.remove('from-emerald-500', 'to-emerald-400');
    overallBar.classList.add('from-red-500', 'to-rose-400');
    overallCount.textContent = '';
  }, delayMs);
}

export function renderProgressItems(items) {
  progressList.innerHTML = '';
  states = items.map(it => ({ ...it }));
  items.forEach((it, idx) => {
    const node = progressTpl.content.firstElementChild.cloneNode(true);
    node.dataset.index = idx;
    $('[data-field="title"]', node).textContent = 'Wird geladen ...';
    $('[data-field="url"]', node).textContent = it.url;
    $('[data-field="format"]', node).textContent = it.format.toUpperCase();
    const videoId = extractVideoId(it.url);
    if (videoId) {
      $('[data-field="thumb"]', node).src = getThumbnailUrl(videoId);
      $('.thumbnail-small', node).classList.remove('hidden');
    }
    progressList.appendChild(node);
  });
  updateOverall();
}

export function updateProgressItem(data) {
  const row = progressList.querySelector(`[data-index="${data.index}"]`);
  if (!row) return;
  if (states[data.index]) Object.assign(states[data.index], data);

  const statusEl = $('[data-field="status"]', row);
  const barEl = $('[data-field="bar"]', row);
  const percentEl = $('[data-field="percent"]', row);
  const titleEl = $('[data-field="title"]', row);
  const speedEl = $('[data-field="speed"]', row);
  const etaEl = $('[data-field="eta"]', row);

  if (data.status) {
    statusEl.textContent = STATUS_LABEL[data.status] || data.status;
    statusEl.className = `text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-lg shrink-0 ${STATUS_BADGE[data.status] || STATUS_BADGE.queued}`;
  }
  if (typeof data.percent === 'number') {
    barEl.style.width = `${data.percent}%`;
    percentEl.textContent = `${data.percent.toFixed(1)}%`;
  }
  if (data.speed) {
    const spd = formatSpeed(data.speed);
    if (spd) { speedEl.textContent = spd; speedEl.classList.remove('hidden'); }
  }
  if (data.eta) {
    const eta = formatEta(data.eta);
    if (eta) { etaEl.textContent = `~${eta}`; etaEl.classList.remove('hidden'); }
  }
  if (data.title) titleEl.textContent = data.title;
  if (data.filename && !data.title) titleEl.textContent = data.filename;

  if (data.status === 'error' && data.error) {
    titleEl.textContent = data.error;
    titleEl.classList.add('text-rose-400');
    row.classList.add('border-rose-500/20');
  }
  if (data.status === 'done') {
    barEl.classList.remove('from-red-500', 'to-rose-400');
    barEl.classList.add('from-emerald-500', 'to-emerald-400');
    row.classList.add('border-emerald-500/10');
    speedEl.classList.add('hidden');
    etaEl.classList.add('hidden');
  }
  if (data.status === 'processing') {
    speedEl.classList.add('hidden');
    etaEl.textContent = 'konvertiert ...';
    etaEl.classList.remove('hidden');
  }
  if (data.status === 'cancelled') {
    barEl.classList.remove('from-red-500', 'to-rose-400');
    barEl.classList.add('from-orange-500', 'to-orange-400');
    row.classList.add('border-orange-500/15', 'opacity-60');
    speedEl.classList.add('hidden');
    etaEl.classList.add('hidden');
    if (!data.title) titleEl.textContent = 'Abgebrochen';
  }
  updateOverall();
}

export function getStates() { return states; }
