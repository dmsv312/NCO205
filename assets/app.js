(() => {
  // Legacy ride cards (kept for compatibility)
  const rideOptions = document.querySelectorAll('.ride-option');
  const selectedPrice = document.querySelector('.js-selected-price');

  rideOptions.forEach((option) => {
    option.addEventListener('click', () => {
      rideOptions.forEach((item) => item.classList.remove('is-selected'));
      option.classList.add('is-selected');

      if (selectedPrice) {
        selectedPrice.textContent = option.dataset.price || '$0.00';
      }
    });
  });

  // University/student fare browser
  const rangeMin = document.querySelector('.js-range-min');
  const rangeMax = document.querySelector('.js-range-max');
  const priceMinLabel = document.querySelector('.js-price-min');
  const priceMaxLabel = document.querySelector('.js-price-max');
  const priceCurrent = document.querySelector('.js-price-current');
  const fareRows = Array.from(document.querySelectorAll('.fare-row'));
  const fareCats = Array.from(document.querySelectorAll('.fare-cat'));
  const manualIncluded = new Set();

  fareRows.forEach((row, index) => {
    if (!row.dataset.id) {
      row.dataset.id = `row-${index + 1}`;
    }
  });

  const applyFareRange = () => {
    if (!fareRows.length) return;

    let min = rangeMin ? Number(rangeMin.value) : 0;
    let max = rangeMax ? Number(rangeMax.value) : Number.POSITIVE_INFINITY;

    if (min > max) {
      [min, max] = [max, min];
      if (rangeMin) rangeMin.value = String(min);
      if (rangeMax) rangeMax.value = String(max);
    }

    if (priceMinLabel) priceMinLabel.textContent = String(min);
    if (priceMaxLabel) priceMaxLabel.textContent = String(max);
    if (priceCurrent) priceCurrent.textContent = String(max);

    fareRows.forEach((row) => {
      const id = row.dataset.id;
      const price = Number(row.dataset.price || 0);
      const checkbox = row.querySelector('input[type="checkbox"]');
      const inRange = price >= min && price <= max;

      row.classList.toggle('is-in-range', inRange);

      if (inRange) {
        row.classList.remove('is-manual');
        manualIncluded.delete(id);
        if (checkbox) checkbox.checked = true;
      } else if (manualIncluded.has(id)) {
        row.classList.add('is-manual');
        if (checkbox) checkbox.checked = true;
      } else {
        row.classList.remove('is-manual');
        if (checkbox) checkbox.checked = false;
      }
    });

    fareCats.forEach((cat) => {
      const catName = cat.dataset.cat;
      const hasInRange = fareRows.some(
        (row) => row.dataset.category === catName && row.classList.contains('is-in-range')
      );
      cat.classList.toggle('is-in-range', hasInRange);
    });
  };

  if (rangeMin && rangeMax && fareRows.length) {
    rangeMin.addEventListener('input', () => {
      if (Number(rangeMin.value) > Number(rangeMax.value)) {
        rangeMax.value = rangeMin.value;
      }
      applyFareRange();
    });

    rangeMax.addEventListener('input', () => {
      if (Number(rangeMax.value) < Number(rangeMin.value)) {
        rangeMin.value = rangeMax.value;
      }
      applyFareRange();
    });
  }

  fareRows.forEach((row) => {
    const id = row.dataset.id;
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    checkbox.addEventListener('change', () => {
      if (row.classList.contains('is-in-range')) {
        checkbox.checked = true;
        return;
      }

      if (checkbox.checked) {
        manualIncluded.add(id);
      } else {
        manualIncluded.delete(id);
      }

      applyFareRange();
    });

    row.addEventListener('click', (event) => {
      if (event.target === checkbox) return;

      event.preventDefault();

      if (row.classList.contains('is-in-range')) {
        return;
      }

      checkbox.checked = !checkbox.checked;
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  if (fareRows.length) {
    applyFareRange();
  }

  // Bottom tab auto-highlight
  const currentPath = window.location.pathname.split('/').pop();
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    const routes = (tab.dataset.tab || '')
      .split(',')
      .map((route) => route.trim())
      .filter(Boolean);

    if (routes.includes(currentPath)) {
      tab.classList.add('is-active');
    }
  });
})();
