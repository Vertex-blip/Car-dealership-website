// Kuttibay: required fields, email, password length, and confirmation.
(() => {
  const form = document.querySelector('#account-form');
  if (!form) return;

  const fields = {
    name: form.querySelector('#full-name'),
    email: form.querySelector('#account-email'),
    password: form.querySelector('#password'),
    confirmation: form.querySelector('#confirm-password')
  };
  const status = form.querySelector('#account-status');
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function messageFor(input) {
    if (input === fields.name) return input.value.trim() ? '' : 'Please enter your full name.';
    if (input === fields.email) {
      if (!input.value.trim()) return 'Please enter your email address.';
      return emailPattern.test(input.value.trim()) ? '' : 'Enter a valid email address, such as name@example.com.';
    }
    if (input === fields.password) {
      if (!input.value) return 'Please enter a password.';
      return input.value.length >= 8 ? '' : 'Your password must contain at least 8 characters.';
    }
    if (!input.value) return 'Please confirm your password.';
    return input.value === fields.password.value ? '' : 'The passwords do not match.';
  }

  function validate(input) {
    const error = form.querySelector(`#${input.id}-error`);
    const message = messageFor(input);
    error.textContent = message;
    input.setAttribute('aria-invalid', String(Boolean(message)));
    return !message;
  }

  Object.values(fields).forEach((input) => {
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validate(input);
      if (input === fields.password && fields.confirmation.value) validate(fields.confirmation);
      status.textContent = '';
      delete status.dataset.state;
    });
    input.addEventListener('blur', () => {
      if (input.value) validate(input);
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = Object.values(fields).filter((input) => !validate(input));
    if (invalid.length) {
      status.textContent = 'Please correct the highlighted fields.';
      status.dataset.state = 'error';
      invalid[0].focus();
      return;
    }
    status.textContent = 'All details are valid. This preview does not create an account.';
    status.dataset.state = 'success';
  });
})();
