/* Three-step inquiry, JavaScript validation and a browser-local inquiry history. */
(() => {
  "use strict";
  const form = document.getElementById("inquiryForm");
  if (!form) return;
  const Apex = window.Apex;
  const steps = [...form.querySelectorAll("[data-inquiry-step]")];
  const groups = [["fullName", "email"], ["vehicle", "budget", "phone", "message"], []];
  const next = document.getElementById("nextStep");
  const back = document.getElementById("previousStep");
  const submit = document.getElementById("submitInquiry");
  const status = document.getElementById("formStatus");
  const success = document.getElementById("inquirySuccess");
  const vehicle = document.getElementById("vehicle");
  const phone = document.getElementById("phone");
  let step = 0;
  let pending = false;
  const currentIdentity = () => Apex.account?.currentUser()?.id || null;
  let draftUserId = currentIdentity();
  const input = (id) => document.getElementById(id);
  const value = (id) => input(id).value.trim();
  const byPhone = () => form.querySelector('[name="replyMethod"]:checked')?.value === "phone";
  for (const car of Apex.vehicles) {
    const option = document.createElement("option");
    option.value = car.id;
    option.textContent = car.name;
    vehicle.append(option);
  }
  function setError(id, message) {
    input(id).setAttribute("aria-invalid", String(Boolean(message)));
    const feedback = input(`${id}Error`);
    feedback.textContent = message;
    feedback.classList.toggle("d-block", Boolean(message));
    return !message;
  }
  function error(id) {
    const text = value(id);
    switch (id) {
      case "fullName": return text.length >= 2 && text.length <= 80 ? "" : "Enter your name using 2 to 80 characters.";
      case "email": return Apex.account.emailError(text);
      case "vehicle": return !text || Apex.vehicles.some((car) => car.id === text) ? "" : "Choose a car from the list.";
      case "budget": return !text || (/^\d+(?:\.\d{1,2})?$/.test(text) && Number.isFinite(Number(text)) && Number(text) <= 1e12) ? "" : "Enter a budget in KZT using a positive number, such as 18000000.";
      case "phone": return byPhone() ? Apex.account.phoneError(text) : "";
      case "message": return input(id).value.length <= 600 ? "" : "Keep your message within 600 characters.";
      default: return "";
    }
  }
  function validate(index, focus = true) {
    let first;
    for (const id of groups[index]) if (!setError(id, error(id)) && !first) first = input(id);
    if (focus) first?.focus();
    return !first;
  }
  function updatePhone() {
    const visible = byPhone();
    input("phoneField").hidden = !visible;
    phone.disabled = !visible;
    phone.setAttribute("aria-required", String(visible));
    if (!visible) setError("phone", "");
  }
  function selectedCar() { return Apex.vehicles.find((car) => car.id === vehicle.value); }
  function summaryEntries() {
    return [
      ["Name", value("fullName")], ["Email", value("email")],
      ["Vehicle", selectedCar()?.name || "Not selected"],
      ["Budget", value("budget") ? `${Number(value("budget")).toLocaleString("en-US")} KZT` : "Not specified"],
      ["Reply by", byPhone() ? `Phone: ${phone.value.trim()}` : "Email"],
      ["Test drive", input("testDrive").checked ? "Interested" : "Not requested"],
      ["Message", value("message") || "No additional message"],
    ];
  }
  function renderSummary() {
    const summary = input("inquirySummary");
    summary.replaceChildren();
    for (const [label, text] of summaryEntries()) {
      const row = document.createElement("div");
      row.className = "summary-row";
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = text;
      row.append(dt, dd);
      summary.append(row);
    }
  }
  function showStep(index, focus = true) {
    step = index;
    steps.forEach((panel, position) => { panel.hidden = position !== step; });
    back.hidden = step === 0;
    next.hidden = step === 2;
    submit.hidden = step !== 2;
    input("inquiryStepCount").textContent = `Step ${step + 1} of 3`;
    document.querySelectorAll("[data-step-label]").forEach((label, position) => {
      if (position === step) label.setAttribute("aria-current", "step");
      else label.removeAttribute("aria-current");
    });
    input("inquiryProgress").textContent = `Step ${step + 1} of 3: ${["Contact details", "Preferences", "Review"][step]}`;
    status.textContent = "";
    status.classList.remove("is-error");
    if (step === 2) renderSummary();
    if (focus) {
      const legend = steps[step].querySelector("legend");
      legend.tabIndex = -1;
      legend.focus();
    }
  }
  function forward() {
    if (pending) return;
    if (!checkIdentity()) return;
    if (!validate(step)) { status.textContent = "Please correct the highlighted fields before continuing."; return; }
    showStep(Math.min(2, step + 1));
  }
  next.addEventListener("click", forward);
  back.addEventListener("click", () => { if (!pending) showStep(Math.max(0, step - 1)); });
  form.querySelectorAll('[name="replyMethod"]').forEach((radio) => radio.addEventListener("change", updatePhone));
  form.addEventListener("input", (event) => {
    if (groups.flat().includes(event.target.id) && event.target.getAttribute("aria-invalid") === "true") setError(event.target.id, error(event.target.id));
    if (groups[step].every((id) => !error(id))) status.textContent = "";
  });
  function prefill() {
    try {
      const user = Apex.account?.currentUser();
      if (user) {
        input("fullName").value = user.name;
        input("email").value = user.email;
        phone.value = user.phone || "";
      }
    } catch { /* The form can still be filled manually. */ }
  }
  function reset(focus = true) {
    if (pending) return;
    form.reset();
    groups.flat().forEach((id) => setError(id, ""));
    input("completedInquiryPreview")?.remove();
    input("copyInquiry")?.remove();
    prefill();
    draftUserId = currentIdentity();
    updatePhone();
    form.hidden = false;
    success.hidden = true;
    showStep(0, focus);
  }
  function checkIdentity() {
    if (currentIdentity() === draftUserId) return true;
    // Do not expose or attribute a previous account's contact draft to another account.
    reset(false);
    status.textContent = "Your signed-in account changed. The previous draft was cleared; start a new inquiry with your current details.";
    return false;
  }
  input("resetInquiry").addEventListener("click", () => reset());
  input("newInquiry").addEventListener("click", () => reset());
  addEventListener("storage", (event) => {
    if (event.key === "apex-session" || event.key === "apex-users" || event.key === null) checkIdentity();
  });
  addEventListener("pageshow", checkIdentity);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pending || form.hidden) return;
    if (!checkIdentity()) return;
    if (step < 2) { forward(); return; }
    for (let index = 0; index < groups.length; index++) {
      if (!validate(index, false)) { showStep(index, false); validate(index); status.textContent = "Please correct the highlighted fields."; return; }
    }
    pending = true;
    submit.disabled = true;
    form.setAttribute("aria-busy", "true");
    try {
      const raw = localStorage.getItem("apex-inquiries");
      const records = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(records)) throw new Error("Unreadable inquiry history");
      const user = Apex.account?.currentUser();
      if ((user?.id || null) !== draftUserId) { checkIdentity(); return; }
      const record = {
        id: crypto.randomUUID(), userId: draftUserId,
        fullName: value("fullName"), email: value("email").toLowerCase(),
        vehicleId: vehicle.value, vehicleName: selectedCar()?.name || "General inquiry",
        budget: value("budget") ? Number(value("budget")) : null,
        replyMethod: byPhone() ? "phone" : "email", phone: byPhone() ? phone.value.trim() : "",
        message: value("message"), testDrive: input("testDrive").checked,
        createdAt: new Date().toISOString(),
      };
      records.push(record);
      localStorage.setItem("apex-inquiries", JSON.stringify(records));
      const summary = "Apex Motors — saved inquiry\n" + summaryEntries().map(([label, text]) => `${label}: ${text}`).join("\n") + "\nSaved in this browser. No message sent or appointment booked.";
      const preview = document.createElement("pre");
      preview.id = "completedInquiryPreview";
      preview.className = "inquiry-summary inquiry-preview";
      preview.textContent = summary;
      const copy = document.createElement("button");
      copy.id = "copyInquiry";
      copy.type = "button";
      copy.className = "btn btn-outline-primary copy-button";
      copy.dataset.copyText = summary;
      const copyLabel = document.createElement("span");
      copyLabel.className = "copy-label";
      copyLabel.textContent = "Copy inquiry";
      copy.append(copyLabel);
      success.insertBefore(preview, input("newInquiry"));
      success.insertBefore(copy, input("newInquiry"));
      input("inquirySuccessText").textContent = `${record.fullName}, your ${record.vehicleName === "General inquiry" ? "inquiry" : `inquiry about ${record.vehicleName}`} is ready to review.`;
      form.hidden = true;
      success.hidden = false;
      input("inquiryStepCount").textContent = "Complete";
      input("inquiryProgress").textContent = "Inquiry saved.";
      success.focus();
    } catch {
      status.textContent = "Your inquiry could not be saved. Allow site storage in your browser and try again. Your details are still here.";
      status.classList.add("is-error");
    } finally {
      pending = false;
      submit.disabled = false;
      form.setAttribute("aria-busy", "false");
    }
  });
  prefill();
  const requested = new URLSearchParams(location.search).get("vehicle");
  if (Apex.vehicles.some((car) => car.id === requested)) vehicle.value = requested;
  updatePhone();
  showStep(0, false);
})();
