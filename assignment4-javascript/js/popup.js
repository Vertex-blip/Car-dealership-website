// Arsen: contact dialog, outside-click dismissal, and form feedback.
(() => {
  const dialog = document.querySelector('#contact-dialog');
  if (!dialog) return;
  const openButtons = document.querySelectorAll('[data-open-contact]');
  const closeButton = document.querySelector('#close-contact');
  const form = document.querySelector('#contact-form');
  const status = document.querySelector('#contact-status');
  const inputs = [form.querySelector('#contact-name'), form.querySelector('#contact-email'), form.querySelector('#contact-message')];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let opener = null;

  function validate(input) {
    let message = '';
    if (!input.value.trim()) message = input.id === 'contact-message' ? 'Please write your question.' : `Please enter your ${input.id === 'contact-name' ? 'name' : 'email address'}.`;
    else if (input.id === 'contact-email' && !emailPattern.test(input.value.trim())) message = 'Enter a valid email address.';
    document.getElementById(`${input.id}-error`).textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  openButtons.forEach((button) => button.addEventListener('click', () => {
    opener = button;
    dialog.showModal();
    form.querySelector('#contact-name').focus();
  }));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    if (outside) dialog.close();
  });
  inputs.forEach((input) => input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') validate(input);
    status.textContent = '';
    delete status.dataset.state;
  }));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = inputs.filter((input) => !validate(input));
    if (invalid.length) {
      status.textContent = 'Please correct the highlighted fields.';
      status.dataset.state = 'error';
      invalid[0].focus();
      return;
    }
    status.textContent = 'Message looks good. This demo does not send it.';
    status.dataset.state = 'success';
  });
})();
