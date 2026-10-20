// Farabi: JavaScript-controlled FAQ with accessible expanded state.
(() => {
  const toggles = document.querySelectorAll('.faq-toggle');
  toggles.forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    panel.inert = true;
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded));
      panel.setAttribute('aria-hidden', String(expanded));
      panel.inert = expanded;
      panel.classList.toggle('is-open', !expanded);
    });
  });
})();
