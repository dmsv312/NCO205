(() => {
  // Legacy ride cards (kept for compatibility if screen variant is reused)
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

  // New fare browser (price slider + categories + row selection)
  const priceRange = document.querySelector('.js-price-range');
  const priceValue = document.querySelector('.js-price-value');
  const selectedFare = document.querySelector('.js-selected-fare');
  const fareRows = Array.from(document.querySelectorAll('.fare-row'));
  const fareGroups = Array.from(document.querySelectorAll('.fare-group'));
  const fareCats = Array.from(document.querySelectorAll('.fare-cat'));

  let activeCategory = 'all';

  const setSelectedFare = (row) => {
    fareRows.forEach((item) => {
      item.classList.remove('is-selected');
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.checked = false;
    });

    row.classList.add('is-selected');
    const selectedCheckbox = row.querySelector('input[type="checkbox"]');
    if (selectedCheckbox) selectedCheckbox.checked = true;

    if (selectedFare) {
      const price = Number(row.dataset.price || 0);
      selectedFare.textContent = `$${price.toFixed(2)}`;
    }
  };

  const applyFareFilters = () => {
    const maxPrice = priceRange ? Number(priceRange.value) : Number.POSITIVE_INFINITY;

    if (priceValue) {
      priceValue.textContent = String(maxPrice);
    }

    fareRows.forEach((row) => {
      const rowPrice = Number(row.dataset.price || 0);
      const rowCat = row.dataset.category || 'all';

      const byPrice = rowPrice <= maxPrice;
      const byCategory = activeCategory === 'all' || rowCat === activeCategory;

      row.classList.toggle('is-hidden', !(byPrice && byCategory));
    });

    fareGroups.forEach((group) => {
      const hasVisible = !!group.querySelector('.fare-row:not(.is-hidden)');
      group.classList.toggle('is-hidden', !hasVisible);
    });

    const selectedRow = document.querySelector('.fare-row.is-selected:not(.is-hidden)');
    if (!selectedRow) {
      const firstVisible = document.querySelector('.fare-row:not(.is-hidden)');
      if (firstVisible) setSelectedFare(firstVisible);
    }
  };

  if (priceRange && fareRows.length) {
    priceRange.addEventListener('input', applyFareFilters);
  }

  fareCats.forEach((button) => {
    button.addEventListener('click', () => {
      fareCats.forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');
      activeCategory = button.dataset.cat || 'all';
      applyFareFilters();
    });
  });

  fareRows.forEach((row) => {
    const checkbox = row.querySelector('input[type="checkbox"]');

    row.addEventListener('click', (event) => {
      if (event.target !== checkbox) {
        setSelectedFare(row);
      }
    });

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          setSelectedFare(row);
        } else {
          row.classList.remove('is-selected');
          const firstVisible = document.querySelector('.fare-row:not(.is-hidden)');
          if (firstVisible) setSelectedFare(firstVisible);
        }
      });
    }
  });

  if (fareRows.length) {
    applyFareFilters();
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
