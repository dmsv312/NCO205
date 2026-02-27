(() => {
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
