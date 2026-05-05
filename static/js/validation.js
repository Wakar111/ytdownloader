/** URL validation and video info fetching. */

import { $, debounce, extractVideoId, isValidYouTubeUrl, getThumbnailUrl, formatDuration } from './utils.js';

const infoCache = {};

async function fetchVideoInfo(url, row) {
  if (infoCache[url]) return applyInfo(infoCache[url], row);
  try {
    const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
    if (!res.ok) return;
    const data = await res.json();
    infoCache[url] = data;
    applyInfo(data, row);
  } catch { /* ignore */ }
}

function applyInfo(data, row) {
  const infoEl = $('.video-info', row);
  if (!infoEl) return;
  if (data.title) $('.info-title', row).textContent = data.title;
  if (data.duration) $('.info-duration', row).textContent = formatDuration(data.duration);
  if (data.uploader) $('.info-uploader', row).textContent = `· ${data.uploader}`;
  infoEl.classList.remove('hidden');
  if (data.thumbnail) {
    const img = $('.thumbnail-img', row);
    const wrap = $('.thumbnail-wrap', row);
    if (img) { img.src = data.thumbnail; wrap.classList.remove('hidden'); }
  }
}

const debouncedFetch = debounce((url, row) => fetchVideoInfo(url, row), 600);

export function validateUrlInput(input, row) {
  const val = input.value.trim();
  const statusWrap = $('.url-status', row);
  const validIcon = $('.valid-icon', row);
  const invalidIcon = $('.invalid-icon', row);
  const thumbWrap = $('.thumbnail-wrap', row);
  const thumbImg = $('.thumbnail-img', row);
  const infoEl = $('.video-info', row);

  if (!val) {
    statusWrap.classList.add('hidden');
    thumbWrap.classList.add('hidden');
    if (infoEl) infoEl.classList.add('hidden');
    return;
  }

  statusWrap.classList.remove('hidden');
  const videoId = extractVideoId(val);
  const valid = isValidYouTubeUrl(val);

  if (valid) {
    validIcon.classList.remove('hidden');
    invalidIcon.classList.add('hidden');
    input.classList.remove('border-rose-500/40');
    input.classList.add('border-emerald-500/30');
    if (videoId) {
      thumbImg.src = getThumbnailUrl(videoId);
      thumbImg.alt = 'Thumbnail';
      thumbWrap.classList.remove('hidden');
    }
    debouncedFetch(val, row);
  } else {
    validIcon.classList.add('hidden');
    invalidIcon.classList.remove('hidden');
    input.classList.remove('border-emerald-500/30');
    input.classList.add('border-rose-500/40');
    thumbWrap.classList.add('hidden');
    if (infoEl) infoEl.classList.add('hidden');
  }
}
