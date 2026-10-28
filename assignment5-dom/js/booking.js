/* Kuttibay: a stateful, validated multi-step form with explicit navigation callbacks. */
(() => {
  'use strict';
  const form = document.getElementById('booking-form');
  if (!form) return;
  const steps = [...form.querySelectorAll('[data-step]')];
  const nextButton = document.getElementById('booking-next');
  const backButton = document.getElementById('booking-back');
  const submitButton = document.getElementById('booking-submit');
  const status = document.getElementById('booking-status');
  const success = document.getElementById('booking-success');
  const vehicleSelect = document.getElementById('booking-vehicle');
  const fieldsByStep = [
    ['booking-vehicle', 'booking-date', 'booking-time'],
    ['booking-name', 'booking-email', 'booking-phone', 'booking-password', 'booking-confirm'],
    ['booking-consent']
  ];
  let currentStep = 0;

  for (const vehicle of window.Apex.vehicles) {
    const option = document.createElement('option');
    option.value = vehicle.id;
    option.textContent = vehicle.name;
    vehicleSelect.append(option);
  }

  function localDateString(date = new Date()) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }
  const dateField = document.getElementById('booking-date');
  dateField.min = localDateString();

  function setError(id, message) {
    const field = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (error) error.textContent = message;
    return !message;
  }

  function fieldError(id) {
    const input = document.getElementById(id);
    const value = input.value.trim();
    switch (id) {
      case 'booking-vehicle': return window.Apex.vehicles.some(vehicle => vehicle.id === value) ? '' : 'Choose a vehicle.';
      case 'booking-date': {
        // Refresh the minimum so a page left open over midnight still rejects yesterday.
        dateField.min = localDateString();
        if (!value) return 'Choose a date.';
        const parsed = new Date(`${value}T12:00:00`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || localDateString(parsed) !== value) return 'Enter a valid date.';
        return value >= localDateString() ? '' : 'Choose today or a later date.';
      }
      case 'booking-time': return value && [...input.options].some(option => option.value === value && !option.disabled) ? '' : 'Choose a time.';
      case 'booking-name': return value.length >= 2 ? '' : 'Enter your name (at least 2 characters).';
      case 'booking-email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email, for example name@example.com.';
      case 'booking-phone': return /^\+?[\d\s()\-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15 ? '' : 'Enter a phone number with 7 to 15 digits.';
      case 'booking-password': return input.value.replace(/\s/g, '').length >= 8 ? '' : 'Use at least 8 non-space characters for the demo password.';
      case 'booking-confirm': return input.value && input.value === document.getElementById('booking-password').value ? '' : 'Passwords must match.';
      case 'booking-consent': return input.checked ? '' : 'Confirm that you understand this is a local demonstration.';
      default: return '';
    }
  }

  function validateStep(index, focusFirst = true) {
    let firstInvalid = null;
    for (const id of fieldsByStep[index]) {
      const valid = setError(id, fieldError(id));
      if (!valid && !firstInvalid) firstInvalid = document.getElementById(id);
    }
    if (firstInvalid && focusFirst) firstInvalid.focus();
    return !firstInvalid;
  }

  function updateSummary() {
    const vehicle = window.Apex.vehicles.find(item => item.id === vehicleSelect.value);
    const dateValue = dateField.value;
    const date = dateValue ? new Date(`${dateValue}T12:00:00`).toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}) : 'Not selected';
    const time = document.getElementById('booking-time');
    const entries = [
      ['Vehicle', vehicle?.name || 'Not selected'],
      ['Visit', `${date} · ${time.options[time.selectedIndex]?.textContent || 'Not selected'}`],
      ['Name', document.getElementById('booking-name').value.trim()],
      ['Email', document.getElementById('booking-email').value.trim()],
      ['Phone', document.getElementById('booking-phone').value.trim()]
    ];
    const summary = document.getElementById('booking-summary');
    summary.replaceChildren();
    for (const [label, value] of entries) {
      const row = document.createElement('div');
      row.className = 'summary-row';
      const key = document.createElement('dt');
      key.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      row.append(key, detail);
      summary.append(row);
    }
  }

  function showStep(index, focus = true) {
    currentStep = index;
    steps.forEach((step, position) => { step.hidden = position !== currentStep; });
    document.querySelectorAll('[data-step-indicator]').forEach(indicator => {
      const index = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('is-active', index === currentStep);
      indicator.classList.toggle('is-complete', index < currentStep);
      if (index === currentStep) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    backButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === 2;
    submitButton.hidden = currentStep !== 2;
    document.getElementById('step-count').textContent = `Step ${currentStep + 1} of 3`;
    document.getElementById('booking-progress').textContent = ['Choose your drive', 'Your details', 'Review your visit'][currentStep];
    status.textContent = '';
    if (currentStep === 2) updateSummary();
    window.Apex.animate(steps[currentStep]);
    if (focus) {
      const heading = steps[currentStep].querySelector('legend');
      if (heading) { heading.tabIndex = -1; heading.focus(); }
    }
  }

  // Higher-order function: it receives showStep as a callback and runs it after navigation.
  function navigate(direction, onStepChange) {
    if (direction > 0 && !validateStep(currentStep)) {
      status.textContent = 'Please correct the highlighted fields before continuing.';
      return;
    }
    const nextStep = Math.min(2, Math.max(0, currentStep + direction));
    onStepChange(nextStep);
  }
  nextButton.addEventListener('click', () => navigate(1, showStep));
  backButton.addEventListener('click', () => navigate(-1, showStep));

  function resetBooking() {
    form.reset();
    // All input values, including hidden-step passwords, are explicitly cleared.
    form.querySelectorAll('input').forEach(input => {
      if (input.type === 'checkbox') input.checked = false;
      else input.value = '';
    });
    vehicleSelect.value = '';
    document.getElementById('booking-time').value = '';
    fieldsByStep.flat().forEach(id => setError(id, ''));
    document.getElementById('booking-summary').replaceChildren();
    document.getElementById('booking-success-summary').textContent = '';
    success.hidden = true;
    form.hidden = false;
    showStep(0);
    status.textContent = 'Form reset. Your entered details have been cleared.';
  }
  document.getElementById('booking-reset').addEventListener('click', resetBooking);
  document.getElementById('book-again').addEventListener('click', resetBooking);

  form.addEventListener('input', event => {
    const id = event.target.id;
    if (fieldsByStep.flat().includes(id) && event.target.getAttribute('aria-invalid') === 'true') setError(id, fieldError(id));
    if (id === 'booking-password' && document.getElementById('booking-confirm').value) setError('booking-confirm', fieldError('booking-confirm'));
  });
  form.addEventListener('change', event => {
    if (fieldsByStep.flat().includes(event.target.id)) setError(event.target.id, fieldError(event.target.id));
  });
  vehicleSelect.addEventListener('change', () => {
    // A newly chosen vehicle in the gallery restarts navigation but keeps other draft inputs.
    if (form.hidden) {
      const selectedVehicle = vehicleSelect.value;
      resetBooking();
      vehicleSelect.value = selectedVehicle;
    }
    else if (currentStep !== 0) showStep(0, false);
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (currentStep < 2) { navigate(1, showStep); return; }
    for (let index = 0; index < steps.length; index++) {
      if (!validateStep(index, false)) {
        showStep(index, false);
        validateStep(index);
        status.textContent = 'Please correct the highlighted fields.';
        return;
      }
    }
    updateSummary();
    const vehicle = window.Apex.vehicles.find(item => item.id === vehicleSelect.value);
    const name = document.getElementById('booking-name').value.trim();
    document.getElementById('booking-success-summary').textContent = `${name}, your ${vehicle.name} visit preview is ready for ${dateField.value}. This is a local demo: no booking was sent and no account was created.`;
    // Passwords are never added to a summary, localStorage, a URL, or a request.
    document.getElementById('booking-password').value = '';
    document.getElementById('booking-confirm').value = '';
    form.hidden = true;
    success.hidden = false;
    success.tabIndex = -1;
    success.focus();
    window.Apex.animate(success);
    window.Apex.notify('Your test-drive preview is ready.');
  });
  showStep(0, false);
})();
