/** Toast notification system. */

import { $ } from './utils.js';

const container = $('#toast-container');
const tpl = $('#toast-template');

const ICONS = {
  success: '<svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  error: '<svg class="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  warning: '<svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>',
  info: '<svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
};

export function showToast(type, title, message, duration = 4000) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  $('.toast-icon', node).innerHTML = ICONS[type] || ICONS.info;
  $('.toast-title', node).textContent = title;
  $('.toast-message', node).textContent = message;
  container.appendChild(node);
  setTimeout(() => {
    node.classList.remove('toast-enter');
    node.classList.add('toast-exit');
    node.addEventListener('animationend', () => node.remove());
  }, duration);
}
