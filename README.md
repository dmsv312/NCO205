# NCO205 · allride mobile web prototype

Interactive multi-screen mobile web version of the allride concept.

## What is implemented

- Consistent reference palette (soft pink base + deep navy accents)
- Unified UI kit (buttons, cards, inputs, tabs, chips)
- Production-like interactive flow (not static mockups):
  1. Splash
  2. Login / OTP
  3. Home / Search
  4. Journey / Payment
  5. Ride options
  6. Finding vehicle
  7. Tracking
  8. Profile
- State persistence via `localStorage` across screens
- Login validation (phone + OTP)
- Route and destination state synced between pages
- Real map tiles for Singapore routes using Leaflet + OpenStreetMap (Home/Journey/Rides/Tracking)
- Payment method selection
- Fare filtering with presets (Working Adult / University Student)
- Fare selection state carried into Finding + Tracking screens

## Project structure

- `index.html` — screen hub / launcher
- `pages/*.html` — mobile screens
- `assets/styles.css` — global styles + design system
- `assets/app.js` — interactive logic and state handling

## Run locally

Open `index.html` directly, or run a local server:

```bash
npx serve .
```

### Stable preview with Cloudflare Named Tunnel

The repo includes a helper script:

```bash
./scripts/preview-stable.sh start
./scripts/preview-stable.sh status
./scripts/preview-stable.sh stop
```

For a truly stable custom URL (e.g. `preview.allride.com`), DNS must point to a Cloudflare-managed tunnel route in the correct zone.

## Next improvements (optional)

- Migrate to React/Vite for component-based architecture
- Connect real APIs for auth, pricing, and trip tracking
- Add full accessibility pass (focus rings, aria labels, keyboard navigation)
