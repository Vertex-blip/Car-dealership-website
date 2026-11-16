/* Local account simulation. Passwords use a salted PBKDF2 hash, never plain text. */
(() => {
  "use strict";
  const Apex = (window.Apex = window.Apex || {});
  const keys = Object.freeze({ users: "apex-users", session: "apex-session", saved: "apex-motors-saved-vehicles", inquiries: "apex-inquiries" });
  const accountPage = document.querySelector("[data-account-page]");
  const profilePage = document.querySelector("[data-profile-page]");
  // OWASP's PBKDF2-HMAC-SHA256 work factor; stored older hashes remain readable.
  const iterations = 600000;

  function read(key, fallback) {
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { throw new Error("Your browser cannot access saved accounts. Allow site storage and try again."); }
    if (raw === null) return fallback;
    try { return JSON.parse(raw); }
    catch { throw new Error("Your saved account data could not be read. Reset this site’s browser data and try again."); }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { throw new Error("Your browser could not save this change. Free some site storage or allow storage, then try again."); }
  }
  function remove(key) {
    try { localStorage.removeItem(key); }
    catch { throw new Error("Your browser could not update your session. Allow site storage and try again."); }
  }
  function users() {
    const data = read(keys.users, []);
    const valid = (user) => user && typeof user === "object" && !Array.isArray(user)
      && typeof user.id === "string" && user.id.length > 0 && user.id.length <= 100
      && typeof user.name === "string" && !nameError(user.name)
      && typeof user.email === "string" && !emailError(user.email)
      && typeof user.phone === "string" && !phoneError(user.phone)
      && typeof user.createdAt === "string" && user.createdAt.length <= 50 && Number.isFinite(Date.parse(user.createdAt))
      && safePasswordRecord(user.password);
    if (!Array.isArray(data) || data.some((user) => !valid(user))
      || new Set(data.map((user) => user.id)).size !== data.length
      || new Set(data.map((user) => user.email.toLowerCase())).size !== data.length) {
      throw new Error("Your saved accounts could not be read. Reset this site’s browser data and try again.");
    }
    return data;
  }
  function resolveUser() {
    const session = read(keys.session, null);
    if (!session || typeof session.userId !== "string") return null;
    return users().find((user) => user.id === session.userId) || null;
  }
  function publicUser(user) {
    if (!user) return null;
    const { id, name, email, phone, createdAt } = user;
    return { id, name, email, phone, createdAt };
  }
  function currentUser() {
    try { return publicUser(resolveUser()); }
    catch { return null; }
  }
  function savedStorageKey(user = currentUser()) {
    return user?.id ? `${keys.saved}:${user.id}` : keys.saved;
  }
  function adoptGuestSaved(user) {
    const known = new Set((Apex.vehicles || []).map((vehicle) => vehicle.id));
    const ids = (key) => {
      try {
        const data = read(key, []);
        return Array.isArray(data) ? data.filter((id) => typeof id === "string" && known.has(id)) : [];
      } catch { return []; }
    };
    const guest = ids(keys.saved);
    if (guest.length) write(savedStorageKey(user), [...new Set([...ids(savedStorageKey(user)), ...guest])]);
    // A later account must not inherit the previous visitor's browser shortlist.
    remove(keys.saved);
  }
  function returnPath() {
    const value = new URLSearchParams(location.search).get("return");
    if (!value) return "profile.html";
    try {
      const target = new URL(value, location.href);
      const base = new URL(".", location.href);
      const file = target.pathname.slice(base.pathname.length);
      const pages = new Set(["index.html", "inventory.html", "showroom.html", "research.html", "about.html", "inquiry.html", "profile.html"]);
      if (target.origin !== base.origin || !target.pathname.startsWith(base.pathname) || !pages.has(file)) return "profile.html";
      return file + target.search + target.hash;
    } catch { return "profile.html"; }
  }
  function loginUrl() {
    const target = location.pathname.split("/").pop() + location.search + location.hash;
    return `account.html?return=${encodeURIComponent(target)}`;
  }
  function requireUser() {
    try {
      const user = publicUser(resolveUser());
      if (user) return user;
      location.replace(loginUrl());
    } catch (error) { status("profileStatus", error.message, true); }
    return null;
  }
  function logout() {
    try {
      remove(keys.session);
      location.assign("account.html");
      return true;
    } catch (error) {
      status(profilePage ? "profileStatus" : "loginStatus", error.message, true);
      return false;
    }
  }
  Apex.account = Object.freeze({ keys, currentUser, requireUser, logout, savedStorageKey, emailError, phoneError });
  function updateAccountLink() {
    const link = document.getElementById("accountLink");
    const label = document.getElementById("accountLinkLabel");
    if (!link) return;
    const signedIn = Boolean(currentUser());
    link.href = signedIn ? "profile.html" : "account.html";
    link.setAttribute("aria-label", signedIn ? "Profile" : "Sign in");
    if (label) label.textContent = signedIn ? "Profile" : "Sign in";
  }
  updateAccountLink();
  addEventListener("pageshow", updateAccountLink);
  addEventListener("storage", (event) => {
    if (event.key === keys.session || event.key === keys.users || event.key === null) updateAccountLink();
  });
  document.addEventListener("apex:account", updateAccountLink);

  function status(id, message, error = false) {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("is-error", error);
  }
  function errorFor(id, message) {
    const field = document.getElementById(id);
    const feedback = document.getElementById(`${id}Error`);
    field?.setAttribute("aria-invalid", String(Boolean(message)));
    field?.classList.toggle("is-invalid", Boolean(message));
    if (feedback) {
      feedback.textContent = message;
      feedback.classList.toggle("d-block", Boolean(message));
    }
    return !message;
  }
  function value(id) { return document.getElementById(id)?.value.trim() || ""; }
  function nameError(text) { return text.length < 2 ? "Enter your full name (at least 2 characters)." : text.length > 80 ? "Keep your name within 80 characters." : ""; }
  function emailError(text) {
    const invalid = "Enter a valid email address, such as name@example.com.";
    if (typeof text !== "string" || text.length > 254) return invalid;
    const parts = text.split("@");
    if (parts.length !== 2) return invalid;
    const [local, domain] = parts;
    if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..")
      || !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return invalid;
    const labels = domain.split(".");
    if (labels.length < 2 || labels.some((label) => !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label))) return invalid;
    return /^(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{2,59})$/.test(labels.at(-1)) ? "" : invalid;
  }
  function phoneError(text) { return text.length <= 40 && /^\+?[\d\s()\-]+$/.test(text) && text.replace(/\D/g, "").length >= 7 && text.replace(/\D/g, "").length <= 15 ? "" : "Enter a phone number with 7 to 15 digits, including your country code."; }
  function passwordError(text) {
    if (text.length < 8) return "Use at least 8 characters for your password.";
    if (text.length > 128) return "Keep your password within 128 characters.";
    if (!/[A-Z]/.test(text) || !/[a-z]/.test(text) || !/\d/.test(text) || !/[^A-Za-z0-9\s]/.test(text)) return "Include an uppercase letter, a lowercase letter, a number and a symbol.";
    return "";
  }
  function validate(entries, focus = true) {
    let firstInvalid;
    for (const [id, message] of entries) if (!errorFor(id, message) && !firstInvalid) firstInvalid = document.getElementById(id);
    if (focus) firstInvalid?.focus();
    return !firstInvalid;
  }
  function hex(bytes) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""); }
  function unhex(text) { return new Uint8Array(text.match(/.{2}/g).map((byte) => parseInt(byte, 16))); }
  async function passwordHash(password, salt, rounds = iterations) {
    if (!window.crypto?.subtle) throw new Error("Account access needs a secure connection. Open this site using HTTPS or localhost.");
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const result = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unhex(salt), iterations: rounds }, material, 256);
    return hex(new Uint8Array(result));
  }
  function safePasswordRecord(record) {
    return record && typeof record === "object" && !Array.isArray(record)
      && typeof record.salt === "string" && /^[0-9a-f]{32}$/.test(record.salt)
      && typeof record.hash === "string" && /^[0-9a-f]{64}$/.test(record.hash)
      && (record.algorithm === undefined || record.algorithm === "PBKDF2-SHA-256")
      && Number.isInteger(record.iterations) && record.iterations >= 10000 && record.iterations <= 1000000;
  }
  function sameHash(left, right) {
    if (left.length !== right.length) return false;
    let difference = 0;
    for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    return difference === 0;
  }
  function busy(form, active, label) {
    form.setAttribute("aria-busy", String(active));
    const button = form.querySelector('[type="submit"]');
    if (!button.dataset.originalLabel) button.dataset.originalLabel = button.textContent;
    button.disabled = active;
    button.textContent = active ? label : button.dataset.originalLabel;
  }
  document.querySelectorAll("[data-password-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.passwordToggle);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.textContent = show ? "Hide" : "Show";
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute("aria-label", `${show ? "Hide" : "Show"} password${input.id === "signupConfirm" ? " confirmation" : ""}`);
    });
  });

  function initializeAccount() {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    const tabs = [document.getElementById("loginTab"), document.getElementById("signupTab")];
    let pending = false;
    function clearPasswords() {
      document.querySelectorAll('[autocomplete="current-password"], [autocomplete="new-password"]').forEach((field) => {
        field.value = "";
        field.type = "password";
      });
      document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        button.textContent = "Show";
        button.setAttribute("aria-pressed", "false");
        button.setAttribute("aria-label", `Show password${button.dataset.passwordToggle === "signupConfirm" ? " confirmation" : ""}`);
      });
    }
    addEventListener("pagehide", clearPasswords);
    addEventListener("pageshow", (event) => {
      if (event.persisted && currentUser()) location.replace(returnPath());
    });
    try {
      if (resolveUser()) { location.replace(returnPath()); return; }
    } catch (error) { status("loginStatus", error.message, true); }
    function setMode(mode, focus = false) {
      if (pending) return;
      const signup = mode === "signup";
      document.getElementById("loginPanel").hidden = signup;
      document.getElementById("signupPanel").hidden = !signup;
      tabs.forEach((tab, index) => {
        const active = index === (signup ? 1 : 0);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      const url = new URL(location.href);
      if (signup) url.searchParams.set("mode", "signup");
      else url.searchParams.delete("mode");
      history.replaceState(null, "", url);
      if (focus) (signup ? signupForm : loginForm).querySelector("input")?.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => setMode(index ? "signup" : "login"));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index;
        setMode(next ? "signup" : "login");
        tabs[next].focus();
      });
    });
    document.querySelectorAll("[data-account-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.accountMode, true)));
    setMode(new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login");
    function loginEntries() {
      return [["loginEmail", emailError(value("loginEmail"))], ["loginPassword", passwordError(document.getElementById("loginPassword").value)]];
    }
    function signupEntries() {
      const password = document.getElementById("signupPassword").value;
      return [["signupName", nameError(value("signupName"))], ["signupEmail", emailError(value("signupEmail"))], ["signupPhone", phoneError(value("signupPhone"))], ["signupPassword", passwordError(password)], ["signupConfirm", document.getElementById("signupConfirm").value === password && password ? "" : "Enter the same password again."]];
    }
    [[loginForm, loginEntries, "loginStatus"], [signupForm, signupEntries, "signupStatus"]].forEach(([form, entries, statusId]) => {
      form.addEventListener("input", (event) => {
        const current = entries();
        for (const [id, message] of current) if (id === event.target.id && event.target.getAttribute("aria-invalid") === "true") errorFor(id, message);
        if (event.target.id === "signupPassword" && document.getElementById("signupConfirm").getAttribute("aria-invalid") === "true") errorFor("signupConfirm", current.find(([id]) => id === "signupConfirm")[1]);
        status(statusId, "");
      });
    });
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (pending || !validate(loginEntries())) return;
      pending = true;
      busy(loginForm, true, "Logging in…");
      status("loginStatus", "Checking your details…");
      try {
        const email = value("loginEmail").toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const user = users().find((item) => item.email.toLowerCase() === email);
        if (!user || !safePasswordRecord(user.password) || !sameHash(await passwordHash(password, user.password.salt, user.password.iterations), user.password.hash)) {
          errorFor("loginPassword", "The email or password is incorrect. Please try again.");
          status("loginStatus", "We couldn’t log you in. Check your email and password.", true);
          document.getElementById("loginPassword").focus();
          return;
        }
        // Hashing is asynchronous: do not open a session for an account changed meanwhile.
        const latest = users().find((item) => item.id === user.id && item.email.toLowerCase() === email);
        if (!latest || latest.password.hash !== user.password.hash || latest.password.salt !== user.password.salt || latest.password.iterations !== user.password.iterations) {
          status("loginStatus", "This account changed while you were logging in. Check your details and try again.", true);
          return;
        }
        adoptGuestSaved(latest);
        write(keys.session, { userId: user.id });
        clearPasswords();
        location.assign(returnPath());
      } catch (error) { status("loginStatus", error.message, true); }
      finally { pending = false; busy(loginForm, false); }
    });
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (pending || !validate(signupEntries())) return;
      pending = true;
      busy(signupForm, true, "Creating account…");
      status("signupStatus", "Creating your account…");
      try {
        const list = users();
        const email = value("signupEmail").toLowerCase();
        if (list.some((user) => user.email.toLowerCase() === email)) {
          errorFor("signupEmail", "An account with this email already exists. Log in instead.");
          status("signupStatus", "Use a different email address or log in to your existing account.", true);
          document.getElementById("signupEmail").focus();
          return;
        }
        const password = document.getElementById("signupPassword").value;
        const name = value("signupName");
        const phone = value("signupPhone");
        if (!window.crypto?.getRandomValues) throw new Error("Account access needs a secure connection. Open this site using HTTPS or localhost.");
        const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
        const hash = await passwordHash(password, salt);
        // Check storage again after hashing, so another open tab is not overwritten.
        const latest = users();
        if (latest.some((user) => user.email.toLowerCase() === email)) {
          errorFor("signupEmail", "An account with this email already exists. Log in instead.");
          status("signupStatus", "This email was just registered. Log in to continue.", true);
          return;
        }
        const user = { id: `apex-${hex(crypto.getRandomValues(new Uint8Array(12)))}`, name, email, phone, password: { algorithm: "PBKDF2-SHA-256", iterations, salt, hash }, createdAt: new Date().toISOString() };
        write(keys.users, [...latest, user]);
        try { adoptGuestSaved(user); write(keys.session, { userId: user.id }); }
        catch (error) { throw new Error(`Your account was created, but we couldn’t open a session. Try logging in. ${error.message}`); }
        clearPasswords();
        location.assign(returnPath());
      } catch (error) { status("signupStatus", error.message, true); }
      finally { pending = false; busy(signupForm, false); }
    });
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function dateLabel(value) {
    if (typeof value !== "string") return "Date unavailable";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function initializeProfile() {
    let user = requireUser();
    if (!user) return;
    const content = document.getElementById("profileContent");
    const editForm = document.getElementById("profileEditForm");
    const editButton = document.getElementById("editProfileButton");
    content.hidden = false;
    function renderDetails() {
      document.getElementById("profileGreeting").textContent = user.name.split(/\s+/)[0];
      for (const [id, text] of [["profileName", user.name], ["profileEmail", user.email], ["profilePhone", user.phone], ["profileJoined", dateLabel(user.createdAt)]]) document.getElementById(id).textContent = text;
    }
    function edit(open) {
      editForm.hidden = !open;
      document.getElementById("profileDetails").hidden = open;
      editButton.setAttribute("aria-expanded", String(open));
      editButton.hidden = open;
      status("editStatus", "");
      if (open) {
        for (const [id, text] of [["editName", user.name], ["editEmail", user.email], ["editPhone", user.phone]]) { document.getElementById(id).value = text; errorFor(id, ""); }
        document.getElementById("editName").focus();
      }
    }
    function renderSaved() {
      const grid = document.getElementById("profileSavedCars");
      grid.replaceChildren();
      document.getElementById("profileSavedCount").textContent = "0";
      const ownerId = user.id;
      const storageKey = savedStorageKey(user);
      let ids;
      try { ids = read(storageKey, []); }
      catch (error) { grid.append(element("p", "account-empty", error.message)); return; }
      const vehicles = Array.isArray(Apex.vehicles) ? Apex.vehicles : [];
      const cars = vehicles.filter((car) => Array.isArray(ids) && ids.includes(car.id));
      document.getElementById("profileSavedCount").textContent = cars.length;
      if (!cars.length) {
        grid.append(element("p", "account-empty", "No saved cars yet. Tap Save on a car in the collection to keep it here."));
        return;
      }
      for (const car of cars) {
        const card = element("article", "profile-saved-card");
        const image = element("img");
        image.src = car.image;
        image.alt = car.alt || car.name;
        image.width = 600;
        image.height = 400;
        image.loading = "lazy";
        const body = element("div", "profile-saved-body");
        const label = element("p", "vehicle-label", `${car.categoryLabel} · ${car.year}`);
        const heading = element("h3", "profile-car-title", car.name);
        const price = element("p", "profile-car-price", `₸ ${Number(car.price).toLocaleString("en-US")}`);
        const actions = element("div", "profile-car-actions");
        const link = element("a", "text-link", "Enquire ↗");
        link.href = `inquiry.html?vehicle=${encodeURIComponent(car.id)}`;
        const button = element("button", "text-button", "Remove");
        button.type = "button";
        button.setAttribute("aria-label", `Remove ${car.name} from saved cars`);
        button.addEventListener("click", () => {
          try {
            const authenticated = currentUser();
            if (!authenticated || authenticated.id !== ownerId) { content.hidden = true; location.replace(loginUrl()); return; }
            const saved = read(storageKey, []);
            write(storageKey, Array.isArray(saved) ? saved.filter((id) => id !== car.id) : []);
            renderSaved();
            status("profileSavedStatus", `${car.name} was removed from your saved cars.`);
            (grid.querySelector("button") || grid.closest("section")?.querySelector("a"))?.focus();
          } catch (error) { status("profileSavedStatus", error.message, true); }
        });
        actions.append(link, button);
        body.append(label, heading, price, actions);
        card.append(image, body);
        grid.append(card);
      }
    }
    function renderInquiries() {
      const region = document.getElementById("profileInquiries");
      region.replaceChildren();
      document.getElementById("profileInquiryCount").textContent = "0";
      let data;
      try { data = read(keys.inquiries, []); }
      catch (error) { region.append(element("p", "account-empty", error.message)); return; }
      // An unverified email address does not establish ownership of a guest inquiry.
      const records = Array.isArray(data) ? data : [];
      const safe = (item) => item && typeof item === "object" && !Array.isArray(item)
        && typeof item.userId === "string" && item.userId === user.id
        && typeof item.vehicleName === "string" && item.vehicleName.length <= 150
        && typeof item.email === "string" && !emailError(item.email)
        && typeof item.phone === "string" && item.phone.length <= 40
        && typeof item.message === "string" && item.message.length <= 600
        && (item.budget === null || (typeof item.budget === "number" && Number.isFinite(item.budget) && item.budget >= 0 && item.budget <= 1e12))
        && ["email", "phone"].includes(item.replyMethod) && (item.replyMethod !== "phone" || !phoneError(item.phone)) && typeof item.testDrive === "boolean"
        && typeof item.createdAt === "string" && item.createdAt.length <= 50 && Number.isFinite(Date.parse(item.createdAt));
      const inquiries = records.filter(safe).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      document.getElementById("profileInquiryCount").textContent = inquiries.length;
      if (!inquiries.length) { region.append(element("p", "account-empty", "No inquiries yet. Choose a car and tell us what you’re looking for.")); return; }
      for (const inquiry of inquiries) {
        const card = element("article", "profile-inquiry-card");
        const heading = element("div", "profile-inquiry-heading");
        heading.append(element("h3", "", inquiry.vehicleName || "General inquiry"), element("time", "muted", dateLabel(inquiry.createdAt)));
        const details = element("p", "profile-inquiry-meta");
        const parts = [inquiry.replyMethod === "phone" ? `Reply by phone: ${inquiry.phone || user.phone}` : `Reply by email: ${inquiry.email || user.email}`];
        if (inquiry.budget && Number.isFinite(Number(inquiry.budget))) parts.push(`Budget: ₸ ${Number(inquiry.budget).toLocaleString("en-US")}`);
        details.textContent = parts.join(" · ");
        card.append(heading, details);
        if (inquiry.testDrive) card.append(element("p", "profile-inquiry-meta", "Test drive requested"));
        if (inquiry.message) card.append(element("p", "profile-inquiry-message", String(inquiry.message)));
        card.append(element("p", "profile-inquiry-state", "Saved in this browser"));
        region.append(card);
      }
    }
    function editEntries() { return [["editName", nameError(value("editName"))], ["editEmail", emailError(value("editEmail"))], ["editPhone", phoneError(value("editPhone"))]]; }
    editForm.addEventListener("input", (event) => {
      if (event.target.getAttribute("aria-invalid") === "true") {
        const entry = editEntries().find(([id]) => id === event.target.id);
        if (entry) errorFor(...entry);
      }
      status("editStatus", "");
    });
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!validate(editEntries())) return;
      try {
        const authenticated = resolveUser();
        if (!authenticated || authenticated.id !== user.id) { location.replace(loginUrl()); return; }
        const list = users();
        const email = value("editEmail").toLowerCase();
        if (list.some((item) => item.id !== user.id && item.email.toLowerCase() === email)) { errorFor("editEmail", "Another account already uses this email address."); document.getElementById("editEmail").focus(); return; }
        const updated = { ...authenticated, name: value("editName"), email, phone: value("editPhone") };
        write(keys.users, list.map((item) => item.id === user.id ? updated : item));
        user = publicUser(updated);
        renderDetails();
        renderSaved();
        renderInquiries();
        edit(false);
        status("profileStatus", "Your details have been updated.");
        editButton.focus();
        document.dispatchEvent(new CustomEvent("apex:account", { detail: { user } }));
      } catch (error) { status("editStatus", error.message, true); }
    });
    editButton.addEventListener("click", () => edit(true));
    document.getElementById("cancelProfileEdit").addEventListener("click", () => { edit(false); editButton.focus(); });
    document.getElementById("logoutButton").addEventListener("click", logout);
    // A restored page must recheck the session before revealing cached account details.
    addEventListener("pagehide", () => { content.hidden = true; });
    addEventListener("pageshow", () => {
      content.hidden = true;
      const latest = requireUser();
      if (!latest) return;
      user = latest;
      edit(false);
      renderDetails();
      renderSaved();
      renderInquiries();
      content.hidden = false;
    });
    addEventListener("storage", (event) => {
      if (event.key === keys.session || event.key === keys.users || event.key === null) {
        const latest = requireUser();
        if (!latest) { content.hidden = true; return; }
        user = latest;
        edit(false);
        renderDetails();
        renderSaved();
        renderInquiries();
      }
      if (event.key === savedStorageKey(user) || event.key === null) renderSaved();
      if (event.key === keys.inquiries || event.key === null) renderInquiries();
    });
    renderDetails();
    renderSaved();
    renderInquiries();
  }
  if (accountPage) initializeAccount();
  if (profilePage) initializeProfile();
})();
