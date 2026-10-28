/* Render the vehicle collection, category filters and persistent saved cars. */
(() => {
  'use strict';
  const grid = document.getElementById('inventoryGrid');
  if (!grid) return;

  const vehicles = window.Apex.vehicles;
  const categoryButtons = [...document.querySelectorAll('[data-category]')];
  const count = document.getElementById('inventoryCount');
  const savedOnlyButton = document.getElementById('savedOnlyButton');
  const savedCount = document.getElementById('savedCount');
  const savedStatus = document.getElementById('savedStatus');
  const storageKey = 'apex-motors-saved-vehicles';
  let category = 'all';
  let savedOnly = false;
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
      const ids = JSON.parse(stored || '[]');
      if (!Array.isArray(ids)) return [];
      // Keep only known vehicle IDs and discard duplicates or stale data.
      return [...new Set(ids.filter(id => vehicles.some(vehicle => vehicle.id === id)))];
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
    // Each switch branch controls which objects reach the visible card grid.
    switch (category) {
      case 'touring': return vehicle.category === 'touring';
      case 'performance': return vehicle.category === 'performance';
      case 'adventure': return vehicle.category === 'adventure';
      default: return true;
    }
  }

  function updateSaveButton(button, vehicle) {
    const saved = savedIds.includes(vehicle.id);
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${vehicle.name}${saved ? ' from saved cars' : ' to saved cars'}`);
    button.replaceChildren();
    const heart = element('span', 'save-heart', saved ? '♥' : '♡');
    heart.setAttribute('aria-hidden', 'true');
    button.append(heart, document.createTextNode(saved ? 'Saved' : 'Save'));
  }

  function updateSavedFilter() {
    savedCount.textContent = savedIds.length;
    savedOnlyButton.setAttribute('aria-pressed', String(savedOnly));
    savedOnlyButton.setAttribute('aria-label', `Show saved vehicles only (${savedIds.length} saved)`);
    savedOnlyButton.classList.toggle('active', savedOnly);
    savedOnlyButton.classList.toggle('btn-primary', savedOnly);
    savedOnlyButton.classList.toggle('btn-outline-primary', !savedOnly);
  }

  function makeCard(vehicle) {
    const card = element('article', 'vehicle-card card');
    card.dataset.vehicleId = vehicle.id;
    const image = element('img', 'card-img-top');
    image.src = vehicle.image;
    image.alt = vehicle.alt;
    image.width = 1400;
    image.height = 933;
    const body = element('div', 'card-body');
    const label = element('p', 'vehicle-label', vehicle.label());
    const heading = element('h3', 'card-title', vehicle.name);
    const description = element('p', 'card-text', vehicle.description);
    const action = element('a', 'btn btn-primary', 'Ask about this car');
    action.href = '#inquiry';
    action.dataset.inquire = vehicle.id;
    const saveButton = element('button', 'btn btn-outline-primary save-vehicle');
    saveButton.type = 'button';
    saveButton.dataset.saveVehicle = vehicle.id;
    updateSaveButton(saveButton, vehicle);
    const actions = element('div', 'vehicle-actions');
    actions.append(action, saveButton);
    body.append(label, heading, description, actions);
    card.append(image, body);
    return card;
  }

  function render(animate = true) {
    // filter is higher-order: it receives matchesCategory as its predicate callback.
    const selectedVehicles = vehicles.filter(matchesCategory)
      .filter(vehicle => !savedOnly || savedIds.includes(vehicle.id));
    const fragment = document.createDocumentFragment();
    for (const vehicle of selectedVehicles) fragment.append(makeCard(vehicle));
    if (!selectedVehicles.length) {
      const message = savedIds.length
        ? 'No saved cars in this category. Choose another category or turn off Saved.'
        : 'No saved cars yet. Turn off Saved, then press Save on a car you like.';
      fragment.append(element('p', 'inventory-empty', message));
    }
    grid.replaceChildren(fragment);
    count.textContent = `${selectedVehicles.length} ${savedOnly ? 'saved ' : ''}${selectedVehicles.length === 1 ? 'vehicle' : 'vehicles'} shown.`;
    updateSavedFilter();
    if (animate) window.Apex.animate(grid);
  }

  categoryButtons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category;
    categoryButtons.forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-pressed', String(selected));
      item.classList.toggle('active', selected);
      item.classList.toggle('btn-primary', selected);
      item.classList.toggle('btn-outline-primary', !selected);
    });
    render();
  }));
  savedOnlyButton.addEventListener('click', () => {
    savedOnly = !savedOnly;
    render();
  });

  // One delegated listener also handles buttons created after category changes.
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-save-vehicle]');
    const vehicle = vehicles.find(item => item.id === button?.dataset.saveVehicle);
    if (!vehicle) return;
    const wasSaved = savedIds.includes(vehicle.id);
    savedIds = wasSaved ? savedIds.filter(id => id !== vehicle.id) : [...savedIds, vehicle.id];
    const persisted = storeSavedIds();
    savedStatus.textContent = `${vehicle.name} ${wasSaved ? 'removed from saved cars.' : 'saved.'}`
      + (persisted ? '' : ' This change could not be kept for your next visit; it lasts until this page is reloaded.');
    if (savedOnly && wasSaved) {
      // The removed card disappears. Keep keyboard focus inside the collection controls.
      render();
      (grid.querySelector('[data-save-vehicle]') || savedOnlyButton).focus();
    } else {
      // Avoid replacing the focused button when its card is still visible.
      updateSaveButton(button, vehicle);
      updateSavedFilter();
      window.Apex.animate(button);
    }
  });

  if (!storageAvailable) {
    savedStatus.textContent = 'You can save cars while this page is open, but your browser cannot keep them for your next visit.';
  }
  render(false);
})();
