/* The existing inquiry form now uses three steps and explicit navigation callbacks. */
(() => {
  'use strict';
  const form = document.getElementById('inquiryForm');
  if (!form) return;

  const steps = [...form.querySelectorAll('[data-inquiry-step]')];
  const nextButton = document.getElementById('nextStep');
  const previousButton = document.getElementById('previousStep');
  const submitButton = document.getElementById('submitInquiry');
  const status = document.getElementById('formStatus');
  const success = document.getElementById('inquirySuccess');
  const vehicleSelect = document.getElementById('vehicle');
  const phone = document.getElementById('phone');
  const fieldsByStep = [
    ['fullName', 'email'],
    ['vehicle', 'budget', 'phone', 'message'],
    []
  ];
  let currentStep = 0;

  function replyByPhone() {
    return form.querySelector('input[name="replyMethod"]:checked')?.value === 'phone';
  }

  function setError(id, message) {
    const field = document.getElementById(id);
    const error = document.getElementById(`${id}Error`);
    field.setAttribute('aria-invalid', String(Boolean(message)));
    field.classList.toggle('is-invalid', Boolean(message));
    if (error) {
      error.textContent = message;
      // Feedback may sit outside a control group, so show its own visible state.
      error.classList.toggle('d-block', Boolean(message));
    }
    return !message;
  }

  function fieldError(id) {
    const field = document.getElementById(id);
    const value = field.value.trim();
    switch (id) {
      case 'fullName': return value.length >= 2 ? '' : 'Enter your full name (at least 2 characters).';
      case 'email': return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Enter a valid email address, such as name@example.com.';
      case 'vehicle': return !value || window.Apex.vehicles.some(vehicle => vehicle.id === value) ? '' : 'Choose a vehicle from the list.';
      case 'budget':
        if (field.validity.badInput) return 'Enter a valid budget amount.';
        return !value || (Number.isFinite(Number(value)) && Number(value) >= 0) ? '' : 'Enter a budget of zero or more.';
      case 'phone':
        if (!replyByPhone()) return '';
        return /^\+?[\d\s()\-]+$/.test(value) && value.replace(/\D/g, '').length >= 7
          && value.replace(/\D/g, '').length <= 15 ? '' : 'Enter a phone number with 7 to 15 digits.';
      case 'message': return field.value.length <= 600 ? '' : 'Keep the message within 600 characters.';
      default: return '';
    }
  }

  function updatePhoneField() {
    const required = replyByPhone();
    document.getElementById('phoneField').hidden = !required;
    phone.required = required;
    phone.disabled = !required;
    if (!required) setError('phone', '');
  }

  function validateStep(index, focusFirst = true) {
    let firstInvalid = null;
    for (const id of fieldsByStep[index]) {
      if (!setError(id, fieldError(id)) && !firstInvalid) firstInvalid = document.getElementById(id);
    }
    if (focusFirst && firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  function clearResolvedStatus() {
    // Read validity without adding new error messages before a navigation attempt.
    if (fieldsByStep[currentStep].every(id => fieldError(id) === '')) status.textContent = '';
  }

  function updateSummary() {
    const selectedVehicle = window.Apex.vehicles.find(vehicle => vehicle.id === vehicleSelect.value);
    const budget = document.getElementById('budget').value;
    const entries = [
      ['Name', document.getElementById('fullName').value.trim()],
      ['Email', document.getElementById('email').value.trim()],
      ['Vehicle', selectedVehicle?.name || 'Not selected'],
      ['Budget', budget ? `${Number(budget).toLocaleString('en-US')} KZT` : 'Not specified'],
      ['Reply by', replyByPhone() ? `Phone: ${phone.value.trim()}` : 'Email'],
      ['Test drive', document.getElementById('testDrive').checked ? 'Interested' : 'Not requested'],
      ['Message', document.getElementById('message').value.trim() || 'No additional message']
    ];
    const summary = document.getElementById('inquirySummary');
    summary.replaceChildren();
    for (const [label, value] of entries) {
      const row = document.createElement('div');
      row.className = 'summary-row';
      const heading = document.createElement('dt');
      heading.textContent = label;
      const detail = document.createElement('dd');
      detail.textContent = value;
      row.append(heading, detail);
      summary.append(row);
    }
  }

  function showStep(index, moveFocus = true) {
    currentStep = index;
    steps.forEach((step, position) => { step.hidden = position !== currentStep; });
    previousButton.hidden = currentStep === 0;
    nextButton.hidden = currentStep === 2;
    submitButton.hidden = currentStep !== 2;
    document.getElementById('inquiryStepCount').textContent = `Step ${currentStep + 1} of 3`;
    document.querySelectorAll('[data-step-label]').forEach((label, position) => {
      if (position === currentStep) label.setAttribute('aria-current', 'step');
      else label.removeAttribute('aria-current');
    });
    document.getElementById('inquiryProgress').textContent = [
      'Step 1 of 3: Your contact details',
      'Step 2 of 3: Your inquiry',
      'Step 3 of 3: Review your inquiry'
    ][currentStep];
    status.textContent = '';
    if (currentStep === 2) updateSummary();
    window.Apex.animate(steps[currentStep]);
    const legend = steps[currentStep].querySelector('legend');
    if (moveFocus && legend) {
      legend.tabIndex = -1;
      legend.focus();
    }
  }

  // navigateStep receives a callback; the callback displays the selected step.
  function navigateStep(direction, onStepChange) {
    if (direction > 0 && !validateStep(currentStep)) {
      status.textContent = 'Please correct the highlighted fields before continuing.';
      return;
    }
    const nextStep = Math.max(0, Math.min(2, currentStep + direction));
    onStepChange(nextStep);
  }
  nextButton.addEventListener('click', () => navigateStep(1, showStep));
  previousButton.addEventListener('click', () => navigateStep(-1, showStep));

  function clearValues() {
    form.reset();
    form.querySelectorAll('input, textarea').forEach(input => {
      if (input.type === 'radio') input.checked = input.id === 'replyEmail';
      else if (input.type === 'checkbox') input.checked = false;
      else input.value = '';
    });
    vehicleSelect.value = '';
    fieldsByStep.flat().forEach(id => setError(id, ''));
    document.getElementById('inquirySummary').replaceChildren();
    updatePhoneField();
  }

  function resetInquiry() {
    clearValues();
    success.hidden = true;
    form.hidden = false;
    showStep(0);
    status.textContent = 'The inquiry has been reset. All entered details have been cleared.';
  }
  document.getElementById('resetInquiry').addEventListener('click', resetInquiry);
  document.getElementById('newInquiry').addEventListener('click', resetInquiry);

  document.addEventListener('click', event => {
    const link = event.target.closest('[data-inquire]');
    const id = link?.dataset.inquire;
    if (!window.Apex.vehicles.some(vehicle => vehicle.id === id)) return;
    // A new selection keeps the draft, or begins a blank inquiry after completion.
    if (form.hidden) resetInquiry();
    vehicleSelect.value = id;
    setError('vehicle', '');
    showStep(0, false);
  });

  form.querySelectorAll('input[name="replyMethod"]').forEach(input => {
    input.addEventListener('change', updatePhoneField);
  });
  form.addEventListener('input', event => {
    const id = event.target.id;
    if (fieldsByStep.flat().includes(id) && event.target.getAttribute('aria-invalid') === 'true') {
      setError(id, fieldError(id));
    }
    clearResolvedStatus();
  });
  form.addEventListener('change', event => {
    if (fieldsByStep.flat().includes(event.target.id)) setError(event.target.id, fieldError(event.target.id));
    clearResolvedStatus();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (currentStep < 2) { navigateStep(1, showStep); return; }
    for (let index = 0; index < steps.length; index++) {
      if (!validateStep(index, false)) {
        showStep(index, false);
        validateStep(index);
        status.textContent = 'Please correct the highlighted fields.';
        return;
      }
    }
    const name = document.getElementById('fullName').value.trim();
    const selectedVehicle = window.Apex.vehicles.find(vehicle => vehicle.id === vehicleSelect.value);
    const successText = document.getElementById('inquirySuccessText') || success.querySelector('p');
    if (successText) successText.textContent = `${name}, your sample inquiry${selectedVehicle ? ` about ${selectedVehicle.name}` : ''} is ready. This is a local preview; no information was sent.`;
    clearValues();
    form.hidden = true;
    success.hidden = false;
    success.tabIndex = -1;
    success.focus();
    window.Apex.animate(success);
  });

  const requestedVehicle = new URLSearchParams(window.location.search).get('vehicle');
  if (window.Apex.vehicles.some(vehicle => vehicle.id === requestedVehicle)) vehicleSelect.value = requestedVehicle;
  updatePhoneField();
  showStep(0, false);
})();
