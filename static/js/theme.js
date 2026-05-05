/** Dark/Light theme toggle with localStorage persistence. */

import { $ } from './utils.js';

const toggle = $('#theme-toggle');
const iconMoon = $('#icon-moon');
const iconSun = $('#icon-sun');

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('yt-dl-theme', theme);
  iconMoon.classList.toggle('hidden', theme === 'light');
  iconSun.classList.toggle('hidden', theme === 'dark');
}

setTheme(localStorage.getItem('yt-dl-theme') || 'dark');

toggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});
