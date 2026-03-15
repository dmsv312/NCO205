(() => {
  const STORAGE_KEY = 'allride_demo_state_v3';
  const DEMO_OTP = '2468';

  const DEFAULT_DESTINATION_PREFERENCES = {
    'Tampines Mall': 4,
    Home: 3,
    Office: 3,
    'Clementi Mall': 2,
    'Singapore Flyer': 2,
    'Buona Vista MRT': 1,
  };

  const VOUCHER_OPTIONS = [
    {
      id: 'grab-unlimited',
      label: 'GrabUnlimited',
      note: '-$3 on Grab rides',
      providers: ['Grab'],
      discount: 3,
    },
    {
      id: 'ryde-pass',
      label: 'RydePass',
      note: '-$2 on Ryde rides',
      providers: ['Ryde'],
      discount: 2,
    },
    {
      id: 'zig-saver',
      label: 'Zig Saver',
      note: '-$1.50 on CDG Zig rides',
      providers: ['CDG Zig'],
      discount: 1.5,
    },
    {
      id: 'gojek-plus',
      label: 'Gojek Plus',
      note: '-$2.20 on Gojek rides',
      providers: ['Gojek'],
      discount: 2.2,
    },
  ];

  const DEFAULT_STATE = {
    authMode: 'login',
    userName: '',
    phone: '',
    otp: '',
    otpRequested: false,
    pickup: 'Blk C carpark, Singapore University of Social Sciences',
    destination: '',
    paymentMethod: 'VISA',
    selectedVoucherId: '',
    fareMode: 'working',
    fareRangeMin: 10,
    fareRangeMax: 55,
    selectedFareIds: [],
    selectedFareName: 'Taxi or Car · 4 pax',
    selectedFarePrice: 24.4,
    destinationPreferences: { ...DEFAULT_DESTINATION_PREFERENCES },
  };

  const DESTINATION_OPTIONS = [
    {
      value: 'Home',
      icon: '🏠',
      tag: 'Saved',
      note: 'Saved home',
    },
    {
      value: 'Office',
      icon: '💼',
      tag: 'Saved',
      note: 'Office',
    },
    {
      value: 'Tampines Mall',
      icon: '🛍️',
      tag: 'Popular',
      note: 'Tampines Mall',
    },
    {
      value: 'Clementi Mall',
      icon: '🛍️',
      tag: 'Nearby',
      note: 'Clementi Mall',
    },
    {
      value: 'Singapore Flyer',
      icon: '🎡',
      tag: 'Nearby',
      note: 'Singapore Flyer',
    },
    {
      value: 'Buona Vista MRT',
      icon: '🚉',
      tag: 'Nearby',
      note: 'Buona Vista MRT',
    },
  ];

  const PRESETS = {
    working: { min: 10, max: 55, label: 'Working adult mode' },
    university: { min: 10, max: 30, label: 'University student mode' },
  };

  const SG_POINTS = {
    pickup: [1.3322, 103.7768],
    tampinesMall: [1.3532, 103.9444],
    singaporeFlyer: [1.2894, 103.8632],
    orchard: [1.3044, 103.8318],
    cityOffice: [1.3349, 103.9621],
    clementiMall: [1.3152, 103.7649],
    buonaVistaMrt: [1.3074, 103.7903],
  };

  const MAP_CACHE = new Map();

  const normalizeName = (value) => String(value || '').trim();

  const normalizeDestination = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const lower = raw.toLowerCase();

    if (lower.includes('tampines')) return 'Tampines Mall';
    if (lower.includes('flyer')) return 'Singapore Flyer';
    if (lower.includes('clementi')) return 'Clementi Mall';
    if (lower.includes('buona vista') || lower.includes('mrt')) return 'Buona Vista MRT';
    if (lower.includes('office') || lower.includes('work')) return 'Office';
    if (lower.includes('home')) return 'Home';

    return raw;
  };

  const normalizePreferences = (value) => {
    const prefs = value && typeof value === 'object' ? value : {};
    return { ...DEFAULT_DESTINATION_PREFERENCES, ...prefs };
  };

  const normalizeVoucherId = (value) => {
    const voucherId = String(value || '').trim();
    return VOUCHER_OPTIONS.some((voucher) => voucher.id === voucherId) ? voucherId : '';
  };

  const normalizeState = (value = {}) => {
    const normalizedName = normalizeName(value.userName === 'Guest' ? '' : value.userName);

    return {
      ...DEFAULT_STATE,
      ...value,
      authMode: value.authMode === 'signup' ? 'signup' : 'login',
      userName: normalizedName,
      phone: String(value.phone || '').replace(/\D/g, ''),
      otp: String(value.otp || '').replace(/\D/g, ''),
      otpRequested: Boolean(value.otpRequested),
      pickup: normalizeName(value.pickup || DEFAULT_STATE.pickup) || DEFAULT_STATE.pickup,
      destination: normalizeDestination(value.destination),
      selectedVoucherId: normalizeVoucherId(value.selectedVoucherId),
      destinationPreferences: normalizePreferences(value.destinationPreferences),
      selectedFareIds: Array.isArray(value.selectedFareIds) ? value.selectedFareIds.filter(Boolean) : [],
      selectedFarePrice: Number(value.selectedFarePrice || DEFAULT_STATE.selectedFarePrice),
    };
  };

  const parseState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      return normalizeState(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_STATE };
    }
  };

  let state = parseState();

  const saveState = (patch = {}) => {
    state = normalizeState({ ...state, ...patch });
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
    }, 1800);
  };

  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => Array.from(document.querySelectorAll(selector));

  const textOr = (value, fallback) => (value && String(value).trim() ? String(value).trim() : fallback);
  const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

  const getHomeHref = () => (window.location.pathname.includes('/pages/') ? './home.html' : './pages/home.html');
  const getJourneyHref = () => (window.location.pathname.includes('/pages/') ? './journey.html' : './pages/journey.html');
  const getRidesPageHref = () => (window.location.pathname.includes('/pages/') ? './rides.html' : './pages/rides.html');
  const getTrackingHref = () => (window.location.pathname.includes('/pages/') ? './tracking.html' : './pages/tracking.html');
  const getProfileHref = () => (window.location.pathname.includes('/pages/') ? './profile.html' : './pages/profile.html');

  const goToRidesPage = () => {
    window.location.href = getRidesPageHref();
  };

  const getVoucherById = (voucherId) => VOUCHER_OPTIONS.find((voucher) => voucher.id === voucherId) || null;
  const getActiveVoucher = () => getVoucherById(state.selectedVoucherId);

  const getEffectivePrice = (price, providerName = '') => {
    const voucher = getActiveVoucher();
    const basePrice = Number(price || 0);

    if (!voucher) return basePrice;

    const provider = String(providerName || '').toLowerCase();
    const matches = voucher.providers.some((name) => provider.includes(String(name).toLowerCase()));

    if (!matches) return basePrice;

    return Math.max(0, Number((basePrice - voucher.discount).toFixed(2)));
  };

  const formatDestinationLabel = (destination) => {
    const normalized = normalizeDestination(destination);
    if (!normalized) return 'Search your destination';
    if (normalized === 'Home') return 'Saved home';
    return normalized;
  };

  const resolveDestinationCoords = () => {
    const destination = normalizeDestination(state.destination).toLowerCase();

    if (destination.includes('tampines')) return SG_POINTS.tampinesMall;
    if (destination.includes('flyer')) return SG_POINTS.singaporeFlyer;
    if (destination.includes('office')) return SG_POINTS.cityOffice;
    if (destination.includes('clementi')) return SG_POINTS.clementiMall;
    if (destination.includes('buona vista') || destination.includes('mrt')) return SG_POINTS.buonaVistaMrt;
    if (destination.includes('home')) return SG_POINTS.orchard;

    return SG_POINTS.tampinesMall;
  };

  const buildRoutePoints = (start, end) => {
    const mid1 = [
      start[0] + (end[0] - start[0]) * 0.35 + 0.01,
      start[1] + (end[1] - start[1]) * 0.3 - 0.03,
    ];
    const mid2 = [
      start[0] + (end[0] - start[0]) * 0.72 - 0.005,
      start[1] + (end[1] - start[1]) * 0.78 + 0.025,
    ];

    return [start, mid1, mid2, end];
  };

  const getMapRecord = (selector) => {
    const el = qs(selector);
    if (!el || !window.L) return null;

    if (MAP_CACHE.has(selector)) {
      return MAP_CACHE.get(selector);
    }

    const card = el.closest('.map-card');
    if (card) card.classList.add('has-real-map');

    const map = window.L.map(el, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
      dragging: false,
      tap: false,
      boxZoom: false,
      keyboard: false,
      preferCanvas: true,
    });

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = window.L.layerGroup().addTo(map);

    const record = { map, layerGroup };
    MAP_CACHE.set(selector, record);

    setTimeout(() => map.invalidateSize(), 0);

    return record;
  };

  const drawRouteMap = (selector, options = {}) => {
    const record = getMapRecord(selector);
    if (!record) return;

    const { routeStyle = {}, showCar = false, zoomPadding = [26, 26] } = options;

    const start = SG_POINTS.pickup;
    const end = resolveDestinationCoords();
    const route = buildRoutePoints(start, end);

    record.layerGroup.clearLayers();

    window.L.polyline(route, {
      color: '#1f3f9a',
      weight: 4,
      opacity: 0.92,
      lineCap: 'round',
      lineJoin: 'round',
      ...routeStyle,
    }).addTo(record.layerGroup);

    window.L.circleMarker(start, {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#f06a7b',
      fillOpacity: 1,
    }).addTo(record.layerGroup);

    window.L.circleMarker(end, {
      radius: 7,
      color: '#ffffff',
      weight: 2,
      fillColor: '#1d2f74',
      fillOpacity: 1,
    }).addTo(record.layerGroup);

    if (showCar) {
      const carPoint = route[Math.max(1, route.length - 2)];
      window.L.marker(carPoint, {
        icon: window.L.divIcon({
          className: 'map-car-marker',
          html: '<span class="map-car-marker__inner">🚗</span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
      }).addTo(record.layerGroup);
    }

    record.map.fitBounds(window.L.latLngBounds(route), {
      padding: zoomPadding,
      maxZoom: 13,
    });
  };

  const refreshRealMaps = () => {
    if (!window.L) return;

    drawRouteMap('.js-map-home', {
      routeStyle: { dashArray: '9 8' },
      zoomPadding: [30, 30],
    });

    drawRouteMap('.js-map-journey');

    drawRouteMap('.js-map-rides', {
      routeStyle: { dashArray: '7 7', opacity: 0.9 },
    });

    drawRouteMap('.js-map-tracking', {
      showCar: true,
      routeStyle: { dashArray: undefined },
      zoomPadding: [22, 22],
    });
  };

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
      el.textContent = state.destination ? formatDestinationLabel(state.destination) : 'Choose a drop-off';
    });

    qsa('.js-destination-text').forEach((el) => {
      el.textContent = state.destination ? formatDestinationLabel(state.destination) : 'Search your destination';
    });
  };

  const getSortedDestinations = () => {
    const prefs = normalizePreferences(state.destinationPreferences);

    return DESTINATION_OPTIONS
      .map((option, index) => ({
        ...option,
        score: Number(prefs[option.value] || 0),
        index,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.index - b.index;
      });
  };

  const applyDestination = (destination, options = {}) => {
    const { navigate = false, announce = false } = options;
    const normalized = normalizeDestination(destination);
    if (!normalized) return;

    const nextPreferences = normalizePreferences(state.destinationPreferences);
    nextPreferences[normalized] = Number(nextPreferences[normalized] || 0) + 1;

    saveState({
      destination: normalized,
      destinationPreferences: nextPreferences,
    });

    syncRouteTexts();
    renderDestinationSuggestions();
    renderVoucherOptions();
    refreshRealMaps();

    if (announce) {
      toast(`${formatDestinationLabel(normalized)} selected`);
    }

    if (navigate) {
      goToRidesPage();
    }
  };

  const renderDestinationSuggestions = () => {
    const suggestions = getSortedDestinations().slice(0, 4);

    qsa('.js-destination-suggestions').forEach((list) => {
      list.innerHTML = suggestions
        .map((option) => {
          const isActive = normalizeDestination(state.destination) === option.value;
          const label = option.value === 'Home' ? 'Saved home' : option.note;
          return `
            <li class="recent-item js-destination-option${isActive ? ' is-selected' : ''}" data-destination="${option.value}">
              <span>${option.icon} ${label}</span>
              <span>${option.tag}</span>
            </li>
          `;
        })
        .join('');
    });

    qsa('.js-nearby-destinations').forEach((row) => {
      row.innerHTML = suggestions
        .map((option) => {
          const isActive = normalizeDestination(state.destination) === option.value;
          const label = option.value === 'Home' ? 'Saved home' : option.note;
          return `
            <button class="chip-button js-chip-destination${isActive ? ' is-active' : ''}" type="button" data-destination="${option.value}">
              <span>${option.icon}</span>
              <span>${label}</span>
            </button>
          `;
        })
        .join('');
    });

    qsa('.js-destination-option').forEach((item) => {
      item.addEventListener('click', () => {
        applyDestination(item.dataset.destination || '', { navigate: true, announce: true });
      });
    });

    qsa('.js-chip-destination').forEach((button) => {
      button.addEventListener('click', () => {
        applyDestination(button.dataset.destination || '', { announce: true });
      });
    });
  };

  const renderVoucherOptions = () => {
    const activeVoucher = getActiveVoucher();
    const hasVoucherList = qsa('.js-voucher-list').length > 0;

    qsa('.js-voucher-summary').forEach((el) => {
      if (activeVoucher) {
        el.textContent = `${activeVoucher.label} applied · ${activeVoucher.note}`;
      } else if (hasVoucherList) {
        el.textContent = 'Apply service-specific vouchers before choosing a ride.';
      } else {
        el.textContent = 'No voucher applied. Go back to payment choice if you want provider-specific savings.';
      }
    });

    qsa('.js-voucher-list').forEach((row) => {
      row.innerHTML = [
        `
          <button class="chip-button js-voucher-chip${activeVoucher ? '' : ' is-active'}" type="button" data-voucher-id="">
            <span>✕</span>
            <span>No voucher</span>
          </button>
        `,
        ...VOUCHER_OPTIONS.map((voucher) => {
          const isActive = activeVoucher?.id === voucher.id;
          return `
            <button class="chip-button chip-button--voucher js-voucher-chip${isActive ? ' is-active' : ''}" type="button" data-voucher-id="${voucher.id}">
              <span>${voucher.label}</span>
              <span>${voucher.note}</span>
            </button>
          `;
        }),
      ].join('');
    });

    qsa('.js-voucher-chip').forEach((button) => {
      button.addEventListener('click', () => {
        const voucherId = button.dataset.voucherId || '';
        saveState({ selectedVoucherId: voucherId });
        renderVoucherOptions();
        toast(voucherId ? 'Voucher applied' : 'Voucher cleared');
      });
    });
  };

  const initQuickMenu = () => {
    const triggers = qsa('.js-menu-trigger');
    if (!triggers.length) return;

    const currentPath = window.location.pathname.split('/').pop();
    const items = [
      { href: getHomeHref(), label: 'Home', note: 'Greeting, search and saved destinations', routes: ['home.html'] },
      { href: getJourneyHref(), label: 'Payment choice', note: 'Edit route, payment method and vouchers', routes: ['journey.html'] },
      { href: getRidesPageHref(), label: 'Ride & price choice', note: 'Compare ride types and pricing', routes: ['rides.html', 'finding.html'] },
      { href: getTrackingHref(), label: 'Track', note: 'Driver progress and ETA', routes: ['tracking.html'] },
      { href: getProfileHref(), label: 'Profile', note: 'Account and saved info', routes: ['profile.html'] },
    ];

    const overlay = document.createElement('div');
    overlay.className = 'app-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="app-overlay__backdrop"></div>
      <div class="app-sheet" role="dialog" aria-modal="true" aria-label="Quick menu">
        <div class="app-sheet__head">
          <div>
            <p class="label">Quick menu</p>
            <h2 class="app-sheet__title">This button opens shortcuts to the main app sections.</h2>
          </div>
          <button class="app-sheet__close" type="button" aria-label="Close menu">✕</button>
        </div>
        <div class="app-menu-list">
          ${items
            .map((item) => {
              const active = item.routes.includes(currentPath);
              return `
                <a class="app-menu-item${active ? ' is-active' : ''}" href="${item.href}">
                  <span>
                    <strong>${item.label}</strong>
                    <small>${item.note}</small>
                  </span>
                  <span>${active ? 'Current' : 'Open'}</span>
                </a>
              `;
            })
            .join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const openMenu = () => {
      overlay.hidden = false;
      document.body.classList.add('has-overlay');
    };

    const closeMenu = () => {
      overlay.hidden = true;
      document.body.classList.remove('has-overlay');
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', openMenu);
    });

    overlay.querySelector('.app-overlay__backdrop')?.addEventListener('click', closeMenu);
    overlay.querySelector('.app-sheet__close')?.addEventListener('click', closeMenu);
  };

  const initAuth = () => {
    const form = qs('.js-auth-form');
    const phoneInput = qs('.js-input-phone');
    const otpInput = qs('.js-input-otp');
    const nameInput = qs('.js-input-name');
    const loginBtn = qs('.js-login-btn');
    const sendOtpBtn = qs('.js-send-otp-btn');
    const errorBox = qs('.js-auth-error');
    const otpNote = qs('.js-otp-note');
    const helper = qs('.js-auth-helper');
    const nameField = qs('.js-name-field');
    const tabs = qsa('.auth-tab[data-auth-mode]');

    if (!form || !phoneInput || !otpInput || !loginBtn || !sendOtpBtn) return;

    phoneInput.value = state.phone || '';
    otpInput.value = state.otp || '';
    if (nameInput) nameInput.value = state.userName || '';

    const setError = (message = '') => {
      if (!errorBox) return;
      errorBox.textContent = message;
      errorBox.classList.toggle('is-visible', Boolean(message));
    };

    const setMode = (mode) => {
      const authMode = mode === 'signup' ? 'signup' : 'login';
      form.dataset.authMode = authMode;
      saveState({ authMode });

      tabs.forEach((tab) => {
        const isActive = tab.dataset.authMode === authMode;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
      });

      if (nameField) {
        nameField.classList.toggle('is-hidden', authMode !== 'signup');
      }

      if (helper) {
        helper.textContent =
          authMode === 'signup'
            ? 'Create an account with your name and phone number. We use your name only after you enter it here.'
            : 'Log in with your phone number. We only show your name after you entered it during sign up or saved it on this device.';
      }

      loginBtn.textContent = authMode === 'signup' ? 'Create account' : 'Log in';
      setError('');
    };

    setMode(state.authMode || 'login');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        setMode(tab.dataset.authMode || 'login');
      });
    });

    sendOtpBtn.addEventListener('click', () => {
      const phoneRaw = phoneInput.value.replace(/\D/g, '');

      if (phoneRaw.length < 7) {
        setError('Please enter a valid phone number before sending OTP');
        toast('Add a valid phone number first');
        return;
      }

      saveState({ phone: phoneRaw, otpRequested: true });
      setError('');

      if (otpNote) {
        otpNote.textContent = `Demo OTP sent to +65 ${phoneRaw}. Use ${DEMO_OTP}.`;
      }

      toast(`OTP sent · demo code ${DEMO_OTP}`);
    });

    loginBtn.addEventListener('click', (event) => {
      const phoneRaw = phoneInput.value.replace(/\D/g, '');
      const otpRaw = otpInput.value.replace(/\D/g, '');
      const authMode = form.dataset.authMode === 'signup' ? 'signup' : 'login';
      const enteredName = normalizeName(nameInput?.value || '');

      if (authMode === 'signup' && enteredName.length < 2) {
        event.preventDefault();
        setError('Please enter your name to create an account');
        toast('Name required for sign up');
        return;
      }

      if (phoneRaw.length < 7) {
        event.preventDefault();
        setError('Please enter a valid phone number');
        toast('Valid phone number required');
        return;
      }

      if (!state.otpRequested) {
        event.preventDefault();
        setError('Please send OTP before continuing');
        toast('Send OTP first');
        return;
      }

      if (otpRaw.length < 4) {
        event.preventDefault();
        setError('Please enter the 4-digit OTP');
        toast('Please check your OTP');
        return;
      }

      if (otpRaw !== DEMO_OTP) {
        event.preventDefault();
        setError(`Use demo OTP ${DEMO_OTP}`);
        toast('Incorrect demo OTP');
        return;
      }

      setError('');

      saveState({
        authMode,
        phone: phoneRaw,
        otp: otpRaw,
        otpRequested: true,
        userName: authMode === 'signup' ? enteredName : state.userName,
      });
    });
  };

  const initHome = () => {
    const titleEl = qs('.js-greeting-title');
    const subtitleEl = qs('.js-greeting-subtitle');
    const pickupEl = qs('.js-pickup-text');
    const destinationEl = qs('.js-destination-text');
    const searchBtn = qs('.js-open-search');
    const openByAddress = qs('.js-open-rides-by-address');

    if (!titleEl && !subtitleEl && !pickupEl && !destinationEl) return;

    if (titleEl) {
      titleEl.textContent = state.userName ? `Welcome back, ${state.userName}` : 'Ready for your next ride?';
    }

    if (subtitleEl) {
      subtitleEl.textContent = state.userName
        ? 'Your saved places and nearby drop-offs are ready.'
        : 'Choose a nearby drop-off or search manually.';
    }

    if (pickupEl) pickupEl.textContent = textOr(state.pickup, DEFAULT_STATE.pickup);
    if (destinationEl) destinationEl.textContent = state.destination ? formatDestinationLabel(state.destination) : 'Search your destination';

    if (openByAddress) {
      openByAddress.addEventListener('click', () => {
        goToRidesPage();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const userInput = window.prompt('Type a drop-off or choose one of the suggestions below.', state.destination || '');
        if (!userInput) return;
        applyDestination(userInput.trim(), { navigate: true, announce: true });
      });
    }

    renderDestinationSuggestions();
    renderVoucherOptions();
    refreshRealMaps();
  };

  const initJourney = () => {
    if (!qs('.journey-screen')) return;

    syncRouteTexts();
    renderDestinationSuggestions();
    renderVoucherOptions();
    refreshRealMaps();

    const paymentButtons = qsa('.js-payment-chip');
    const addLocationBtn = qs('.js-add-location');
    const goRidesBtn = qs('.js-go-rides');
    const editPickupButtons = qsa('.js-edit-pickup');
    const editDestinationButtons = qsa('.js-edit-destination');

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

    editPickupButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const pickup = window.prompt('Edit pick-up location', state.pickup || DEFAULT_STATE.pickup);
        if (!pickup) return;
        saveState({ pickup: pickup.trim() });
        syncRouteTexts();
        toast('Pick-up updated');
      });
    });

    editDestinationButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const destination = window.prompt('Edit drop-off location', state.destination || '');
        if (!destination) return;
        applyDestination(destination.trim(), { announce: true });
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
          toast('Pick a destination first');
        }
      });
    }

    paintPayments();
  };

  const initRides = () => {
    const fareRows = qsa('.fare-row');
    if (!fareRows.length) return;

    refreshRealMaps();
    syncRouteTexts();
    renderVoucherOptions();

    const rangeMin = qs('.js-range-min');
    const rangeMax = qs('.js-range-max');
    const priceMinLabel = qs('.js-price-min');
    const priceMaxLabel = qs('.js-price-max');
    const priceCurrent = qs('.js-price-current');
    const fareCats = qsa('.fare-cat');
    const modeToggle = qs('.js-mode-toggle');
    const selectedMeta = qs('.js-selected-meta');
    const bookBtn = qs('.js-book-btn');
    const selectAllBtn = qs('.js-select-all-rides');
    const clearAllBtn = qs('.js-clear-all-rides');

    const selectedManual = new Set(Array.isArray(state.selectedFareIds) ? state.selectedFareIds : []);

    const getRowEffectivePrice = (row) => {
      const basePrice = Number(row.dataset.price || 0);
      const provider = row.dataset.provider || '';
      return getEffectivePrice(basePrice, provider);
    };

    const renderFarePrices = () => {
      fareRows.forEach((row) => {
        const priceEl = row.querySelector('.fare-row__price');
        const basePrice = Number(row.dataset.price || 0);
        const effectivePrice = getRowEffectivePrice(row);
        const hasDiscount = effectivePrice < basePrice;

        row.dataset.effectivePrice = String(effectivePrice.toFixed(2));

        if (priceEl) {
          priceEl.textContent = formatPrice(effectivePrice);
          priceEl.classList.toggle('is-discounted', hasDiscount);
          if (hasDiscount) {
            priceEl.title = `Voucher applied · original ${formatPrice(basePrice)}`;
          } else {
            priceEl.removeAttribute('title');
          }
        }
      });
    };

    const setMode = (mode) => {
      const preset = PRESETS[mode] || PRESETS.working;
      saveState({ fareMode: mode, fareRangeMin: preset.min, fareRangeMax: preset.max });

      if (rangeMin) rangeMin.value = String(preset.min);
      if (rangeMax) rangeMax.value = String(preset.max);
      if (modeToggle) modeToggle.textContent = preset.label;
    };

    const applyFareRange = () => {
      renderFarePrices();

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
        const check = row.querySelector('.fare-check');
        const effectivePrice = Number(row.dataset.effectivePrice || getRowEffectivePrice(row));
        const inRange = effectivePrice >= min && effectivePrice <= max;
        const isSelected = selectedManual.has(id);

        row.classList.toggle('is-in-range', inRange);
        row.classList.toggle('is-manual', isSelected);

        if (check) {
          check.checked = isSelected;
        }

        if (isSelected) {
          selectedRows.push(row);
        }
      });

      fareCats.forEach((cat) => {
        const catName = cat.dataset.cat;
        const hasInRange = fareRows.some((row) => row.dataset.category === catName && row.classList.contains('is-in-range'));
        cat.classList.toggle('is-in-range', hasInRange);
      });

      selectedRows.sort((a, b) => Number(a.dataset.effectivePrice || 0) - Number(b.dataset.effectivePrice || 0));
      const mainRide = selectedRows[0] || null;
      const mainRidePrice = mainRide ? Number(mainRide.dataset.effectivePrice || 0) : 0;

      if (selectedMeta) {
        selectedMeta.textContent = `${selectedRows.length} ride type${selectedRows.length === 1 ? '' : 's'} selected`;
      }

      if (bookBtn) {
        bookBtn.textContent = mainRide ? `Continue · ${formatPrice(mainRidePrice)}` : 'Select a ride';
      }

      const selectedFareIds = selectedRows
        .map((row) => row.dataset.id)
        .filter(Boolean);

      saveState({
        fareRangeMin: min,
        fareRangeMax: max,
        selectedFareIds,
        selectedFareName: mainRide ? textOr(mainRide.querySelector('.fare-row__name')?.textContent, DEFAULT_STATE.selectedFareName) : DEFAULT_STATE.selectedFareName,
        selectedFarePrice: mainRide ? mainRidePrice : DEFAULT_STATE.selectedFarePrice,
      });
    };

    if (modeToggle) {
      modeToggle.addEventListener('click', () => {
        const nextMode = state.fareMode === 'working' ? 'university' : 'working';
        setMode(nextMode);
        applyFareRange();
      });
    }

    fareRows.forEach((row) => {
      const id = row.dataset.id || '';
      const check = row.querySelector('.fare-check');

      if (!check) return;

      check.addEventListener('change', () => {
        if (check.checked) {
          selectedManual.add(id);
        } else {
          selectedManual.delete(id);
        }

        applyFareRange();
      });

      row.addEventListener('click', (event) => {
        if (event.target === check) return;

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
          rangeMin.value = rangeMax.value;
        }
        applyFareRange();
      });
    }

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        const inRangeRows = fareRows.filter((row) => row.classList.contains('is-in-range'));
        const targetRows = inRangeRows.length ? inRangeRows : fareRows;

        targetRows.forEach((row) => {
          if (row.dataset.id) selectedManual.add(row.dataset.id);
        });

        applyFareRange();
        toast(`Selected ${targetRows.length} ride type${targetRows.length === 1 ? '' : 's'}`);
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        selectedManual.clear();
        applyFareRange();
        toast('Ride selection cleared');
      });
    }

    if (modeToggle) {
      modeToggle.textContent = (PRESETS[state.fareMode] || PRESETS.working).label;
    }

    if (bookBtn) {
      bookBtn.addEventListener('click', (event) => {
        if (!state.destination) {
          event.preventDefault();
          toast('Pick a destination first');
          return;
        }

        if (!state.selectedFareIds || state.selectedFareIds.length === 0) {
          event.preventDefault();
          toast('Select at least one ride type');
        }
      });
    }

    applyFareRange();
  };

  const initFinding = () => {
    if (!qs('.finding-screen')) return;

    syncRouteTexts();
    renderVoucherOptions();

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
    renderVoucherOptions();
    refreshRealMaps();

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

  const initCancelBooking = () => {
    const buttons = qsa('.js-cancel-booking');
    if (!buttons.length) return;

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const confirmed = window.confirm('Cancel this booking and return to home?');
        if (!confirmed) return;

        saveState({
          selectedFareIds: [],
          selectedFareName: DEFAULT_STATE.selectedFareName,
          selectedFarePrice: DEFAULT_STATE.selectedFarePrice,
        });

        toast('Booking cancelled');
        setTimeout(() => {
          window.location.href = getHomeHref();
        }, 180);
      });
    });
  };

  const initProfile = () => {
    const nameEl = qs('.js-profile-name');
    const phoneEl = qs('.js-profile-phone');

    if (!nameEl && !phoneEl) return;

    if (nameEl) nameEl.textContent = textOr(state.userName, 'Guest user');
    if (phoneEl) {
      phoneEl.textContent = state.phone ? `+65 ${state.phone}` : 'Add your phone on the access screen';
    }
  };

  syncBottomTabs();
  syncRouteTexts();
  initQuickMenu();
  initAuth();
  initHome();
  initJourney();
  initRides();
  initFinding();
  initTracking();
  initCancelBooking();
  initProfile();
  renderDestinationSuggestions();
  renderVoucherOptions();
  refreshRealMaps();
})();
