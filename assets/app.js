(() => {
  const STORAGE_KEY = 'allride_demo_state_v1';

  const DEFAULT_STATE = {
    userName: 'Guest',
    phone: '',
    otp: '',
    pickup: 'Blk C carpark, Singapore University of Social Sciences',
    destination: 'Tampines Mall',
    paymentMethod: 'VISA',
    fareMode: 'working',
    fareRangeMin: 10,
    fareRangeMax: 55,
    selectedFareIds: [],
    selectedFareName: 'Taxi or Car · 4 pax',
    selectedFarePrice: 24.4,
  };

  const PRESETS = {
    working: { min: 10, max: 55, label: 'Working adult mode' },
    university: { min: 10, max: 30, label: 'University student mode' },
  };

  const parseState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch {
      return { ...DEFAULT_STATE };
    }
  };

  let state = parseState();

  const saveState = (patch = {}) => {
    state = { ...state, ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const toast = (message) => {
    const el = document.createElement('div');
    el.className = 'demo-toast';
    el.textContent = message;
    document.body.appendChild(el);

    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 220);
    }, 1700);
  };

  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => Array.from(document.querySelectorAll(selector));

  const textOr = (value, fallback) => (value && String(value).trim() ? String(value).trim() : fallback);

  const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

  const syncBottomTabs = () => {
    const currentPath = window.location.pathname.split('/').pop();
    qsa('[data-tab]').forEach((tab) => {
      const routes = (tab.dataset.tab || '')
        .split(',')
        .map((route) => route.trim())
        .filter(Boolean);

      if (routes.includes(currentPath)) {
        tab.classList.add('is-active');
      }
    });
  };

  const syncRouteTexts = () => {
    qsa('.js-route-pickup').forEach((el) => {
      el.textContent = textOr(state.pickup, DEFAULT_STATE.pickup);
    });
    qsa('.js-route-destination').forEach((el) => {
      el.textContent = textOr(state.destination, DEFAULT_STATE.destination);
    });
  };

  const initAuth = () => {
    const phoneInput = qs('.js-input-phone');
    const otpInput = qs('.js-input-otp');
    const loginBtn = qs('.js-login-btn');
    const errorBox = qs('.js-auth-error');

    if (!phoneInput || !otpInput || !loginBtn) return;

    phoneInput.value = state.phone || '';
    otpInput.value = state.otp || '';

    const setError = (message = '') => {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.classList.toggle('is-visible', Boolean(message));
    };

    loginBtn.addEventListener('click', (event) => {
      const phoneRaw = phoneInput.value.replace(/\D/g, '');
      const otpRaw = otpInput.value.replace(/\D/g, '');

      if (phoneRaw.length < 7) {
        event.preventDefault();
        setError('Please enter a valid phone number');
        toast('Valid phone number required');
        return;
      }

      if (otpRaw.length < 4) {
        event.preventDefault();
        setError('Please enter a 4-digit OTP');
        toast('Please check your OTP');
        return;
      }

      setError('');

      const userName = state.userName === 'Guest' ? `User ${phoneRaw.slice(-3)}` : state.userName;

      saveState({
        phone: phoneRaw,
        otp: otpRaw,
        userName,
      });
    });
  };

  const initHome = () => {
    const nameEl = qs('.js-greeting-name');
    const pickupEl = qs('.js-pickup-text');
    const destinationEl = qs('.js-destination-text');
    const searchBtn = qs('.js-open-search');

    if (!nameEl && !pickupEl && !destinationEl) return;

    if (nameEl) nameEl.textContent = textOr(state.userName, 'Guest');
    if (pickupEl) pickupEl.textContent = textOr(state.pickup, DEFAULT_STATE.pickup);
    if (destinationEl) destinationEl.textContent = textOr(state.destination, 'Search your destination');

    qsa('.js-recent-destination').forEach((item) => {
      item.addEventListener('click', () => {
        const destination = item.dataset.destination || item.textContent || '';
        saveState({ destination: destination.trim() });
        if (destinationEl) destinationEl.textContent = destination.trim();
        toast(`Route: ${destination.trim()}`);
      });
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const userInput = window.prompt('Where are you going?', state.destination || '');
        if (!userInput) return;
        saveState({ destination: userInput.trim() });
        if (destinationEl) destinationEl.textContent = userInput.trim();
      });
    }
  };

  const initJourney = () => {
    if (!qs('.journey-screen')) return;

    syncRouteTexts();

    const paymentButtons = qsa('.js-payment-chip');
    const addLocationBtn = qs('.js-add-location');
    const goRidesBtn = qs('.js-go-rides');

    const paintPayments = () => {
      paymentButtons.forEach((button) => {
        const isActive = button.dataset.payment === state.paymentMethod;
        button.classList.toggle('is-active', isActive);
      });
    };

    paymentButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const paymentMethod = button.dataset.payment || 'VISA';
        saveState({ paymentMethod });
        paintPayments();
      });
    });

    if (addLocationBtn) {
      addLocationBtn.addEventListener('click', () => {
        toast('Additional stop added');
      });
    }

    if (goRidesBtn) {
      goRidesBtn.addEventListener('click', (event) => {
        if (!textOr(state.destination, '')) {
          event.preventDefault();
          toast('Please set a destination first');
        }
      });
    }

    paintPayments();
  };

  const initRides = () => {
    const fareRows = qsa('.fare-row');
    if (!fareRows.length) return;

    const rangeMin = qs('.js-range-min');
    const rangeMax = qs('.js-range-max');
    const priceMinLabel = qs('.js-price-min');
    const priceMaxLabel = qs('.js-price-max');
    const priceCurrent = qs('.js-price-current');
    const fareCats = qsa('.fare-cat');
    const modeToggle = qs('.js-mode-toggle');
    const selectedMeta = qs('.js-selected-meta');
    const bookBtn = qs('.js-book-btn');

    syncRouteTexts();

    const selectedManual = new Set(Array.isArray(state.selectedFareIds) ? state.selectedFareIds : []);

    const setMode = (mode) => {
      const preset = PRESETS[mode] || PRESETS.working;
      saveState({ fareMode: mode, fareRangeMin: preset.min, fareRangeMax: preset.max });

      if (rangeMin) rangeMin.value = String(preset.min);
      if (rangeMax) rangeMax.value = String(preset.max);
      if (modeToggle) modeToggle.textContent = preset.label;
    };

    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        const nextMode = state.fareMode === 'working' ? 'university' : 'working';
        setMode(nextMode);
        applyFareRange();
      });
    }

    const applyFareRange = () => {
      let min = rangeMin ? Number(rangeMin.value) : Number(state.fareRangeMin || 10);
      let max = rangeMax ? Number(rangeMax.value) : Number(state.fareRangeMax || 55);

      if (min > max) {
        [min, max] = [max, min];
        if (rangeMin) rangeMin.value = String(min);
        if (rangeMax) rangeMax.value = String(max);
      }

      if (priceMinLabel) priceMinLabel.textContent = String(min);
      if (priceMaxLabel) priceMaxLabel.textContent = String(max);
      if (priceCurrent) priceCurrent.textContent = String(max);

      const selectedRows = [];

      fareRows.forEach((row) => {
        const id = row.dataset.id || '';
        const price = Number(row.dataset.price || 0);
        const check = row.querySelector('.fare-check');
        const inRange = price >= min && price <= max;

        row.classList.toggle('is-in-range', inRange);

        if (inRange) {
          row.classList.remove('is-manual');
          selectedManual.delete(id);
          if (check) check.checked = true;
          selectedRows.push(row);
        } else if (selectedManual.has(id)) {
          row.classList.add('is-manual');
          if (check) check.checked = true;
          selectedRows.push(row);
        } else {
          row.classList.remove('is-manual');
          if (check) check.checked = false;
        }
      });

      fareCats.forEach((cat) => {
        const catName = cat.dataset.cat;
        const hasInRange = fareRows.some((row) => row.dataset.category === catName && row.classList.contains('is-in-range'));
        cat.classList.toggle('is-in-range', hasInRange);
      });

      selectedRows.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      const mainRide = selectedRows[0] || null;

      if (selectedMeta) {
        selectedMeta.textContent = `${selectedRows.length} option${selectedRows.length === 1 ? '' : 's'} selected`;
      }

      if (bookBtn) {
        bookBtn.textContent = mainRide
          ? `Book · ${formatPrice(mainRide.dataset.price || 0)}`
          : 'Book';
      }

      const selectedFareIds = selectedRows
        .map((row) => row.dataset.id)
        .filter(Boolean);

      saveState({
        fareRangeMin: min,
        fareRangeMax: max,
        selectedFareIds,
        selectedFareName: mainRide ? textOr(mainRide.querySelector('.fare-row__name')?.textContent, DEFAULT_STATE.selectedFareName) : DEFAULT_STATE.selectedFareName,
        selectedFarePrice: mainRide ? Number(mainRide.dataset.price || 0) : DEFAULT_STATE.selectedFarePrice,
      });
    };

    fareRows.forEach((row) => {
      const id = row.dataset.id || '';
      const check = row.querySelector('.fare-check');

      if (!check) return;

      check.addEventListener('change', () => {
        if (row.classList.contains('is-in-range')) {
          check.checked = true;
          return;
        }

        if (check.checked) {
          selectedManual.add(id);
        } else {
          selectedManual.delete(id);
        }

        applyFareRange();
      });

      row.addEventListener('click', (event) => {
        if (event.target === check) return;

        if (row.classList.contains('is-in-range')) return;

        event.preventDefault();
        check.checked = !check.checked;
        check.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    if (rangeMin) {
      rangeMin.value = String(state.fareRangeMin || PRESETS.working.min);
      rangeMin.addEventListener('input', () => {
        if (rangeMax && Number(rangeMin.value) > Number(rangeMax.value)) {
          rangeMax.value = rangeMin.value;
        }
        applyFareRange();
      });
    }

    if (rangeMax) {
      rangeMax.value = String(state.fareRangeMax || PRESETS.working.max);
      rangeMax.addEventListener('input', () => {
        if (rangeMin && Number(rangeMax.value) < Number(rangeMin.value)) {
          if (rangeMin.type === 'range') {
            rangeMin.value = rangeMax.value;
          }
        }
        applyFareRange();
      });
    }

    if (modeToggle) {
      modeToggle.textContent = (PRESETS[state.fareMode] || PRESETS.working).label;
    }

    if (bookBtn) {
      bookBtn.addEventListener('click', (event) => {
        if (!state.selectedFareIds || state.selectedFareIds.length === 0) {
          event.preventDefault();
          toast('Select at least one option');
        }
      });
    }

    applyFareRange();
  };

  const initFinding = () => {
    if (!qs('.finding-screen')) return;

    syncRouteTexts();

    const finderList = qs('.js-finder-list');
    const goTracking = qs('.js-go-tracking');

    if (finderList) {
      const firstName = finderList.querySelector('.finder-row__name');
      const firstPrice = finderList.querySelector('.finder-row__price');

      if (firstName) firstName.textContent = textOr(state.selectedFareName, firstName.textContent);
      if (firstPrice) firstPrice.textContent = formatPrice(state.selectedFarePrice);
    }

    if (goTracking) {
      goTracking.addEventListener('click', () => {
        toast('Driver matched');
      });
    }
  };

  const initTracking = () => {
    if (!qs('.tracking-live-screen')) return;

    syncRouteTexts();

    const fareName = qs('.js-fare-name');
    const farePrice = qs('.js-fare-price');
    const callBtn = qs('.js-call-driver');

    if (fareName) fareName.textContent = textOr(state.selectedFareName, DEFAULT_STATE.selectedFareName);
    if (farePrice) farePrice.textContent = formatPrice(state.selectedFarePrice);

    if (callBtn) {
      callBtn.addEventListener('click', () => {
        toast('Calling driver...');
      });
    }
  };

  const initProfile = () => {
    const nameEl = qs('.js-profile-name');
    const phoneEl = qs('.js-profile-phone');

    if (!nameEl && !phoneEl) return;

    if (nameEl) nameEl.textContent = textOr(state.userName, 'User Name');
    if (phoneEl) {
      phoneEl.textContent = state.phone ? `+65 ${state.phone}` : '+65 8123 4567';
    }
  };

  syncBottomTabs();
  initAuth();
  initHome();
  initJourney();
  initRides();
  initFinding();
  initTracking();
  initProfile();
})();
