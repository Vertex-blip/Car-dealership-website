/* Render, search and save the collection from its shared source data. */
$(document).ready(function () {
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
    image.src = "assets/image-placeholder.svg";
    image.dataset.src = vehicle.image;
    image.alt = vehicle.alt;
    image.width = 1400;
    image.height = 933;
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
    // jQuery filter receives the collection index and the actual vehicle object.
    const selectedVehicles = $(vehicles)
      .filter(function (_, vehicle) {
        return matchesCategory(vehicle) && matchesSearch(vehicle) &&
          (!savedOnly || savedIds.includes(vehicle.id));
      }).get();
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
    $(grid).find(".card-body").each(function () {
      window.Apex.highlight?.(this, searchInput.value);
    });
    window.Apex.observeImages?.(grid);
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
  $(categoryButtons).on("click", function () {
      category = this.dataset.category;
      updateCategoryControls();
      render();
      closeSuggestions();
    });
  $(savedOnlyButton).on("click", () => {
    savedOnly = !savedOnly;
    render();
    closeSuggestions();
  });
  $(searchInput).on("input", function () {
    render(false);
    showSuggestions();
    $("#clearVehicleSearch").prop("hidden", !this.value);
  });
  $(sortSelect).on("change", () => render());

  // Task 2: one combobox, with delegated selection and keyboard focus retained in the input.
  const $suggestions = $("#searchSuggestions");
  let suggestions = [];
  let activeSuggestion = -1;
  function closeSuggestions() {
    $suggestions.prop("hidden", true);
    $(searchInput).attr("aria-expanded", "false").removeAttr("aria-activedescendant");
    activeSuggestion = -1;
  }
  function showSuggestions() {
    const query = searchInput.value.trim().toLocaleLowerCase();
    $suggestions.empty();
    activeSuggestion = -1;
    $(searchInput).removeAttr("aria-activedescendant");
    suggestions = query ? $(vehicles).filter(function (_, vehicle) {
      return matchesCategory(vehicle) && matchesSearch(vehicle) &&
        (!savedOnly || savedIds.includes(vehicle.id));
    }).get().slice(0, 6) : [];
    suggestions.forEach(function (vehicle, index) {
      const $option = $("<li>", {
        id: `car-suggestion-${index}`, role: "option", "aria-selected": "false",
        "data-suggestion-index": index,
      });
      $("<span>").text(vehicle.name).appendTo($option);
      $("<small>").text(vehicle.year).appendTo($option);
      window.Apex.highlight?.($option[0], query);
      $suggestions.append($option);
    });
    $suggestions.prop("hidden", !suggestions.length);
    $(searchInput).attr("aria-expanded", String(suggestions.length > 0));
    $("#suggestionStatus").text(query
      ? `${suggestions.length} suggestions available.${suggestions.length ? " Use the arrow keys to choose." : " Try another search or filter."}` : "");
  }
  function selectSuggestion(index) {
    const selected = suggestions[index];
    if (!selected) return;
    $(searchInput).val(selected.name);
    $("#clearVehicleSearch").prop("hidden", false);
    render(false);
    closeSuggestions();
    $("#suggestionStatus").text(`${selected.name} selected.`);
    searchInput.focus();
  }
  $(searchInput).on("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeSuggestions();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      if ($suggestions.prop("hidden")) showSuggestions();
      if (!suggestions.length) return;
      const direction = event.key === "ArrowDown" ? 1 : -1;
      activeSuggestion = activeSuggestion === -1
        ? (direction === 1 ? 0 : suggestions.length - 1)
        : (activeSuggestion + direction + suggestions.length) % suggestions.length;
      const $options = $suggestions.children();
      $options.attr("aria-selected", "false");
      const $active = $options.eq(activeSuggestion).attr("aria-selected", "true");
      $(this).attr("aria-activedescendant", $active.attr("id"));
      $active[0].scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && activeSuggestion >= 0 && !$suggestions.prop("hidden")) {
      event.preventDefault();
      selectSuggestion(activeSuggestion);
    } else if (event.key === "Tab") closeSuggestions();
  }).on("focus", function () {
    if (this.value.trim()) showSuggestions();
  }).on("blur", function () {
    closeSuggestions();
  });
  $suggestions.on("mousedown", "[role=option]", function (event) { event.preventDefault(); });
  $suggestions.on("click", "[role=option]", function () {
    selectSuggestion(Number($(this).attr("data-suggestion-index")));
  });
  $("#clearVehicleSearch").on("click", function () {
    $(searchInput).val("").trigger("input").trigger("focus");
  });

  // Delegation also handles buttons created by later category changes.
  $(grid).on("click", "[data-save-vehicle]", (event) => {
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
    window.Apex.toast?.(savedStatus.textContent);
    closeSuggestions();
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
});
