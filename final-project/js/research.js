/* The public NHTSA catalogue adds model research to the dealership collection. */
(() => {
  "use strict";

  const form = document.getElementById("researchForm");
  if (!form) return;

  const makeSelect = document.getElementById("researchMake");
  const yearSelect = document.getElementById("researchYear");
  const submit = document.getElementById("researchSubmit");
  const title = document.getElementById("researchResultsTitle");
  const status = document.getElementById("researchStatus");
  const formError = document.getElementById("researchFormError");
  const results = document.getElementById("researchResults");
  const errorPanel = document.getElementById("researchError");
  const errorMessage = document.getElementById("researchErrorMessage");
  const retry = document.getElementById("researchRetry");
  const filter = document.getElementById("researchFilter");
  const search = document.getElementById("researchSearch");
  const CACHE_KEY = "apex-model-research";
  const CHOICE_KEY = "apex-model-research-choice";
  const CACHE_LIFETIME = 24 * 60 * 60 * 1000;
  const maximumYear = new Date().getFullYear() + 1;
  const makes = [...makeSelect.options].map((option) => option.value);
  let models = [];
  let activeChoice = null;
  let requestId = 0;
  let controller = null;
  let sourceLabel = "";
  let memoryCache = {};

  function readStored(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Research remains usable when the browser cannot retain cached results.
    }
  }

  function choiceIsValid(choice) {
    return choice && makes.includes(choice.make) &&
      Number.isInteger(Number(choice.year)) &&
      Number(choice.year) >= 1996 && Number(choice.year) <= maximumYear;
  }

  function makeLabel(make) {
    return [...makeSelect.options].find((option) => option.value === make)?.textContent || make;
  }

  function cacheKey(choice) {
    return `${choice.make}:${choice.year}`;
  }

  function cacheEntryIsValid(entry) {
    return entry && typeof entry.savedAt === "number" &&
      Date.now() >= entry.savedAt && Date.now() - entry.savedAt < CACHE_LIFETIME &&
      Array.isArray(entry.models) && entry.models.length <= 500 &&
      entry.models.every((model) => model && typeof model.name === "string" &&
        model.name.length > 0 && model.name.length <= 150 &&
        typeof model.id === "string");
  }

  function cachedResult(choice) {
    const key = cacheKey(choice);
    const saved = readStored(CACHE_KEY, {});
    const entry = memoryCache[key] || (saved && typeof saved === "object" ? saved[key] : null);
    return cacheEntryIsValid(entry) ? entry : null;
  }

  function rememberResult(choice, data) {
    const saved = readStored(CACHE_KEY, {});
    const cache = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    const entries = Object.entries(cache).filter(([, value]) => cacheEntryIsValid(value));
    entries.push([cacheKey(choice), { savedAt: Date.now(), models: data }]);
    // Bound the cache so repeat research cannot fill the browser's storage.
    memoryCache = Object.fromEntries(entries.slice(-12));
    writeStored(CACHE_KEY, memoryCache);
  }

  function showState(message) {
    const paragraph = document.createElement("p");
    paragraph.className = "research-state";
    paragraph.textContent = message;
    results.replaceChildren(paragraph);
  }

  function paintModels() {
    if (!activeChoice) return;
    const query = search.value.trim().toLocaleLowerCase();
    const visible = models.filter((model) => model.name.toLocaleLowerCase().includes(query));
    results.replaceChildren();
    const fragment = document.createDocumentFragment();
    visible.forEach((model) => {
      const card = document.createElement("a");
      card.className = "research-model";
      card.href = `inventory.html?q=${encodeURIComponent(model.name)}`;
      card.setAttribute("aria-label", `Search our collection for ${makeLabel(activeChoice.make)} ${model.name}`);
      const label = document.createElement("span");
      label.className = "eyebrow";
      label.textContent = `${makeLabel(activeChoice.make)} / ${activeChoice.year}`;
      const name = document.createElement("h4");
      name.textContent = model.name;
      const action = document.createElement("span");
      action.className = "research-model-action";
      action.textContent = "Search collection ↗";
      card.append(label, name, action);
      fragment.append(card);
    });
    results.append(fragment);
    if (!visible.length) {
      showState(models.length
        ? "No model names match your search. Try another name or clear the filter."
        : "No models are listed for this make and year. Try a different year.");
    }
    const count = `${visible.length}${query ? ` of ${models.length}` : ""} ${visible.length === 1 ? "model" : "models"}`;
    status.textContent = `${count} · ${sourceLabel}`;
  }

  function setBusy(busy) {
    results.setAttribute("aria-busy", String(busy));
    form.setAttribute("aria-busy", String(busy));
    // Keep controls available: a changed selection can supersede a slow request.
    submit.textContent = busy ? "Loading models…" : "Explore models →";
    retry.disabled = busy;
  }

  async function loadModels() {
    const choice = { make: makeSelect.value, year: yearSelect.value };
    formError.textContent = "";
    makeSelect.removeAttribute("aria-invalid");
    yearSelect.removeAttribute("aria-invalid");
    if (!choiceIsValid(choice)) {
      formError.textContent = `Choose a make and a model year between 1996 and ${maximumYear}.`;
      makeSelect.setAttribute("aria-invalid", String(!makes.includes(choice.make)));
      yearSelect.setAttribute("aria-invalid", String(!Number.isInteger(Number(choice.year)) || Number(choice.year) < 1996 || Number(choice.year) > maximumYear));
      (!makes.includes(choice.make) ? makeSelect : yearSelect).focus();
      return;
    }

    const currentRequest = ++requestId;
    controller?.abort();
    controller = new AbortController();
    const activeController = controller;
    const timeout = setTimeout(() => activeController.abort(), 15000);
    activeChoice = choice;
    models = [];
    search.value = "";
    filter.hidden = true;
    errorPanel.hidden = true;
    title.textContent = `${makeLabel(choice.make)} · ${choice.year}`;
    status.textContent = "Loading model names from NHTSA…";
    showState("Fetching the vehicle catalogue…");
    setBusy(true);
    writeStored(CHOICE_KEY, choice);

    try {
      const endpoint = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(choice.make)}/modelyear/${encodeURIComponent(choice.year)}?format=json`;
      const response = await fetch(endpoint, { signal: activeController.signal });
      if (!response.ok) throw new Error(`Catalogue returned ${response.status}`);
      const payload = await response.json();
      if (currentRequest !== requestId) return;
      if (!payload || !Array.isArray(payload.Results)) throw new Error("Invalid catalogue response");
      const unique = new Map();
      payload.Results.forEach((model) => {
        if (model && typeof model.Model_Name === "string") {
          const name = model.Model_Name.trim().slice(0, 150);
          if (name) unique.set(name.toLocaleLowerCase(), { name, id: String(model.Model_ID ?? name) });
        }
      });
      models = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));
      rememberResult(choice, models);
      sourceLabel = "Loaded from NHTSA just now";
      filter.hidden = !models.length;
      paintModels();
    } catch (error) {
      if (currentRequest !== requestId) return;
      const cached = cachedResult(choice);
      errorPanel.hidden = false;
      if (cached) {
        models = cached.models;
        const savedTime = new Date(cached.savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
        sourceLabel = `Saved result from ${savedTime}`;
        errorMessage.textContent = "The live catalogue is unavailable. Showing a saved result from the last 24 hours. You can try the live catalogue again.";
        filter.hidden = !models.length;
        paintModels();
      } else {
        sourceLabel = "";
        status.textContent = "Model names could not be loaded.";
        errorMessage.textContent = error.name === "AbortError"
          ? "The catalogue took too long to respond. Please try again."
          : "We could not reach the vehicle catalogue. Check your connection and try again.";
        showState("The model catalogue is unavailable for now. Our collection is still available to browse.");
      }
    } finally {
      clearTimeout(timeout);
      if (currentRequest === requestId) setBusy(false);
    }
  }

  yearSelect.replaceChildren();
  for (let year = maximumYear; year >= 1996; year--) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.append(option);
  }
  const savedChoice = readStored(CHOICE_KEY, null);
  const initialChoice = choiceIsValid(savedChoice) ? savedChoice : { make: "PORSCHE", year: "2024" };
  makeSelect.value = initialChoice.make;
  yearSelect.value = String(initialChoice.year);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    loadModels();
  });
  retry.addEventListener("click", loadModels);
  search.addEventListener("input", paintModels);
  addEventListener("pagehide", () => {
    ++requestId;
    controller?.abort();
  });
  // Fresh requests on arrival make the external data visible during a demo.
  loadModels();
})();
