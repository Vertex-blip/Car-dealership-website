/* Render, search and save the collection from its shared source data. */
(() => {
  "use strict";
  const grid = document.getElementById("inventoryGrid");
  if (!grid || !window.Apex?.vehicles) return;

  const vehicles = window.Apex.vehicles;
  const categoryButtons = [...document.querySelectorAll("[data-category]")];
  const count = document.getElementById("inventoryCount");
  const savedOnlyButton = document.getElementById("savedOnlyButton");
  const savedCount = document.getElementById("savedCount");
  const savedStatus = document.getElementById("savedStatus");
  const searchInput = document.getElementById("vehicleSearch");
  const sortSelect = document.getElementById("vehicleSort");
  const storageKey = "apex-motors-saved-vehicles";
  const query = new URLSearchParams(window.location.search);
  const requestedCategory = query.get("category");
  let category = ["touring", "performance", "adventure"].includes(
    requestedCategory,
  )
    ? requestedCategory
    : "all";
  let savedOnly = query.get("saved") === "1";
  let storageAvailable = true;
  let savedIds = readSavedIds();

  function readSavedIds() {
    let stored;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      storageAvailable = false;
      return [];
    }
    try {
      const ids = JSON.parse(stored || "[]");
      if (!Array.isArray(ids)) return [];
      return [
        ...new Set(
          ids.filter((id) => vehicles.some((vehicle) => vehicle.id === id)),
        ),
      ];
    } catch {
      return [];
    }
  }

  function storeSavedIds() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(savedIds));
      storageAvailable = true;
    } catch {
      storageAvailable = false;
    }
    return storageAvailable;
  }

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function matchesCategory(vehicle) {
    // The switch determines which objects reach the visible card grid.
    switch (category) {
      case "touring":
        return vehicle.category === "touring";
      case "performance":
        return vehicle.category === "performance";
      case "adventure":
        return vehicle.category === "adventure";
      default:
        return true;
    }
  }

  function matchesSearch(vehicle) {
    const query = (searchInput?.value || "").trim().toLocaleLowerCase();
    return (
      !query ||
      `${vehicle.name} ${vehicle.categoryLabel} ${vehicle.year}`
        .toLocaleLowerCase()
        .includes(query)
    );
  }

  function updateSaveButton(button, vehicle) {
    const saved = savedIds.includes(vehicle.id);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute(
      "aria-label",
      `${saved ? "Remove" : "Save"} ${vehicle.name}${saved ? " from saved cars" : " to saved cars"}`,
    );
    button.replaceChildren();
    const heart = element("span", "save-heart", saved ? "♥" : "♡");
    heart.setAttribute("aria-hidden", "true");
    button.append(heart, document.createTextNode(saved ? "Saved" : "Save"));
  }

  function updateSavedFilter() {
    if (savedCount) savedCount.textContent = savedIds.length;
    if (!savedOnlyButton) return;
    savedOnlyButton.setAttribute("aria-pressed", String(savedOnly));
    savedOnlyButton.setAttribute(
      "aria-label",
      `Show saved vehicles only (${savedIds.length} saved)`,
    );
    savedOnlyButton.classList.toggle("active", savedOnly);
    savedOnlyButton.classList.toggle("btn-primary", savedOnly);
    savedOnlyButton.classList.toggle("btn-outline-primary", !savedOnly);
  }

  function makeCard(vehicle, index) {
    const card = element("article", "vehicle-card card");
    card.dataset.vehicleId = vehicle.id;
    const image = element("img", "card-img-top");
    image.src = vehicle.image;
    image.alt = vehicle.alt;
    image.width = 1400;
    image.height = 933;
    image.loading = index < 3 ? "eager" : "lazy";
    image.decoding = "async";
    const body = element("div", "card-body");
    const label = element("p", "vehicle-label", vehicle.label());
    const heading = element("h3", "card-title", vehicle.name);
    const description = element("p", "card-text", vehicle.description);
    const price = element("p", "vehicle-price", vehicle.formattedPrice());
    price.setAttribute(
      "aria-label",
      `Illustrative guide price: ${vehicle.price.toLocaleString("en-US")} tenge`,
    );
    const metadata = element("p", "vehicle-meta", "Guide price · KZT");
    const action = element("a", "btn btn-primary", "Enquire");
    action.href = `inquiry.html?vehicle=${encodeURIComponent(vehicle.id)}`;
    action.dataset.inquire = vehicle.id;
    action.setAttribute("aria-label", `Enquire about ${vehicle.name}`);
    const saveButton = element(
      "button",
      "btn btn-outline-primary save-vehicle",
    );
    saveButton.type = "button";
    saveButton.dataset.saveVehicle = vehicle.id;
    updateSaveButton(saveButton, vehicle);
    const actions = element("div", "vehicle-actions");
    actions.append(action, saveButton);
    body.append(label, heading, description, price, metadata, actions);
    card.append(image, body);
    return card;
  }

  function emptyMessage() {
    if ((searchInput?.value || "").trim())
      return "No cars match your search. Try another name or clear the search.";
    if (savedOnly)
      return savedIds.length
        ? "No saved cars in this category. Choose another category or turn off Saved."
        : "Your shortlist is empty. Turn off Saved and save a car that catches your eye.";
    return "No cars in this category. Choose another category to keep exploring.";
  }

  function render(animate = true) {
    // filter is higher-order: each named predicate is passed as a callback.
    const selectedVehicles = vehicles
      .filter(matchesCategory)
      .filter(matchesSearch)
      .filter((vehicle) => !savedOnly || savedIds.includes(vehicle.id));
    switch (sortSelect?.value) {
      case "price-low":
        selectedVehicles.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        selectedVehicles.sort((a, b) => b.price - a.price);
        break;
      case "year-new":
        selectedVehicles.sort((a, b) => b.year - a.year);
        break;
      default:
        break;
    }
    const fragment = document.createDocumentFragment();
    let index = 0;
    for (const vehicle of selectedVehicles)
      fragment.append(makeCard(vehicle, index++));
    if (!selectedVehicles.length)
      fragment.append(element("p", "inventory-empty", emptyMessage()));
    grid.replaceChildren(fragment);
    if (count)
      count.textContent = `${selectedVehicles.length} ${savedOnly ? "saved " : ""}${selectedVehicles.length === 1 ? "vehicle" : "vehicles"} shown.`;
    updateSavedFilter();
    if (animate) window.Apex.animate?.(grid);
  }

  function updateCategoryControls() {
    categoryButtons.forEach((item) => {
      const selected = item.dataset.category === category;
      item.setAttribute("aria-pressed", String(selected));
      item.classList.toggle("active", selected);
      item.classList.toggle("btn-primary", selected);
      item.classList.toggle("btn-outline-primary", !selected);
    });
  }
  categoryButtons.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.category;
      updateCategoryControls();
      render();
    }),
  );
  savedOnlyButton?.addEventListener("click", () => {
    savedOnly = !savedOnly;
    render();
  });
  searchInput?.addEventListener("input", () => render(false));
  sortSelect?.addEventListener("change", () => render());

  // Delegation also handles buttons created by later category changes.
  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-vehicle]");
    const vehicle = vehicles.find(
      (item) => item.id === button?.dataset.saveVehicle,
    );
    if (!vehicle) return;
    const wasSaved = savedIds.includes(vehicle.id);
    savedIds = wasSaved
      ? savedIds.filter((id) => id !== vehicle.id)
      : [...savedIds, vehicle.id];
    const persisted = storeSavedIds();
    if (savedStatus)
      savedStatus.textContent =
        `${vehicle.name} ${wasSaved ? "removed from your shortlist." : "saved to your shortlist."}` +
        (persisted
          ? ""
          : " Your browser could not keep this change for your next visit.");
    if (savedOnly && wasSaved) {
      render();
      (grid.querySelector("[data-save-vehicle]") || savedOnlyButton)?.focus();
    } else {
      updateSaveButton(button, vehicle);
      updateSavedFilter();
      window.Apex.animate?.(button);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey) return;
    savedIds = readSavedIds();
    render(false);
  });
  if (!storageAvailable && savedStatus) {
    savedStatus.textContent =
      "You can save cars while this page is open; your browser cannot keep them for your next visit.";
  }
  updateCategoryControls();
  render(false);
})();
