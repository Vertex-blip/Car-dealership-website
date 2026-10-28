/* Muhammad: navigation, appearance, feedback, sound and small event-driven interactions. */
(() => {
  'use strict';
  const {notify} = window.Apex;
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  const themeLabel = document.getElementById('theme-label');

  function applyTheme(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeLabel.textContent = dark ? 'Day mode' : 'Night mode';
    themeButton.setAttribute('aria-label', `Switch to ${dark ? 'day' : 'night'} mode`);
  }
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem('apex-theme') || 'light'; } catch { /* Optional persistence. */ }
  applyTheme(savedTheme);
  themeButton.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('apex-theme', next); } catch { /* Theme still changes without storage. */ }
    notify(`${next === 'dark' ? 'Night' : 'Day'} mode is on.`);
  });

  const nav = document.getElementById('main-nav');
  const navLinks = [...nav.querySelectorAll('a')];
  const menuButton = document.getElementById('menu-toggle');
  function closeMenu() {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
  menuButton.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    if (open) navLinks[0].focus();
  });
  // Keyboard focus wraps between links. Tab and Enter keep their ordinary browser behavior.
  nav.addEventListener('keydown', event => {
    const index = navLinks.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': next = (index + 1) % navLinks.length; break;
      case 'ArrowLeft':
      case 'ArrowUp': next = (index - 1 + navLinks.length) % navLinks.length; break;
      case 'Home': next = 0; break;
      case 'End': next = navLinks.length - 1; break;
      case 'Escape':
        if (nav.classList.contains('is-open') && window.matchMedia('(max-width: 640px)').matches) {
          closeMenu();
          menuButton.focus();
        }
        return;
      default: return;
    }
    event.preventDefault();
    navLinks[next].focus();
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  window.matchMedia('(min-width: 641px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const readMore = document.getElementById('read-more');
  const extra = document.getElementById('story-extra');
  // style.display demonstrates the assignment's explicit Read More alternative.
  extra.style.display = 'none';
  readMore.addEventListener('click', () => {
    const open = readMore.getAttribute('aria-expanded') !== 'true';
    extra.style.display = open ? 'block' : 'none';
    readMore.setAttribute('aria-expanded', String(open));
    readMore.textContent = open ? 'Read less ↑' : 'Read our story ↗';
    if (open) window.Apex.animate(extra);
  });

  const stars = [...document.querySelectorAll('[data-rating]')];
  const ratingStatus = document.getElementById('rating-status');
  let selectedRating = 0;
  function showRating(value) {
    selectedRating = value;
    stars.forEach(star => {
      const selected = Number(star.dataset.rating) <= selectedRating;
      star.classList.toggle('is-selected', selected);
      star.setAttribute('aria-pressed', String(Number(star.dataset.rating) === selectedRating));
    });
    ratingStatus.textContent = selectedRating ? `You rated the experience ${selectedRating} out of 5. Thank you!` : 'How was your visit? Choose a star.';
  }
  stars.forEach(star => star.addEventListener('click', () => {
    showRating(Number(star.dataset.rating));
    window.Apex.animate(ratingStatus);
  }));
  document.getElementById('reset-rating').addEventListener('click', () => showRating(0));
  showRating(0);

  // One Audio instance is reused. Pause and rewind prevent overlapping sounds on rapid clicks.
  const sound = new Audio('assets/notification.wav');
  sound.preload = 'auto';
  sound.volume = 0.4;
  const soundButton = document.getElementById('sound-button');
  const soundStatus = document.getElementById('sound-status');
  let soundRequest = 0;
  async function playNotification() {
    const request = ++soundRequest;
    sound.pause();
    sound.currentTime = 0;
    try {
      await sound.play();
      if (request !== soundRequest) return;
      soundButton.dataset.audioState = 'playing';
      soundStatus.textContent = 'Playing a short showroom chime.';
      window.Apex.animate(soundButton);
    } catch (error) {
      if (request !== soundRequest || error.name === 'AbortError') return;
      soundButton.dataset.audioState = 'error';
      soundStatus.textContent = 'Sound could not play. Check your browser sound settings and try again.';
    }
  }
  sound.addEventListener('ended', () => {
    soundButton.dataset.audioState = 'ended';
    soundStatus.textContent = 'Chime played. Click to hear it again.';
  });
  soundButton.addEventListener('click', playNotification);
  window.Apex.sound = sound;
  window.Apex.playNotification = playNotification;

  const clock = document.getElementById('current-datetime');
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  document.getElementById('timezone-label').textContent = `Your device time · ${timeZone}`;
  function updateClock() {
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = now.toLocaleString('en-US', {month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false});
  }
  updateClock();
  setInterval(updateClock, 1000);
  document.getElementById('show-time').addEventListener('click', () => {
    document.getElementById('time-feedback').textContent = `You checked in at ${new Date().toLocaleTimeString('en-US')} (${timeZone}).`;
  });

  document.querySelectorAll('.faq-toggle').forEach(button => {
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    answer.setAttribute('aria-hidden', 'true');
    answer.inert = true;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      button.closest('.faq-item').classList.toggle('is-open', open);
      answer.setAttribute('aria-hidden', String(!open));
      answer.inert = !open;
    });
  });
})();
