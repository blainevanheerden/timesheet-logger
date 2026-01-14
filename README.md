# Timesheet Logger

Minimal Vite + React app containing the `TimesheetLogger` component.

Run locally:

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).

Testing:

- Smoke test (dev server):

```bash
./scripts/smoke-test.sh dev
```

- Playwright E2E tests (will start dev server automatically):

```bash
npx playwright install
npm run test:e2e
```

- Offline & sync E2E test included (covers creating a job offline and syncing it when back online):

```bash
npx playwright test tests/offline-sync.spec.ts
```

CI:

- A GitHub Actions workflow is available at `.github/workflows/ci.yml` that runs `npm ci`, `npm run build`, a smoke test for `dist`, installs Playwright browsers, and runs Playwright tests.

Notes:
- This project uses `lucide-react` for icons and Tailwind classes in the component; you can remove or add Tailwind setup if you prefer.
- If you don't use Tailwind, the UI still works but styling will be basic.

PWA & Android packaging

The app is configured as a Progressive Web App using `vite-plugin-pwa` (service worker + web manifest). You can install it to Android directly from Chrome if you open the site and choose "Add to Home screen" or "Install app".

To produce a native APK or AAB, two popular options are:

1) Trusted Web Activity (TWA) — recommended for PWAs that meet installability criteria. Use Bubblewrap:

```bash
# Build web app
npm run build
# Run interactive Bubblewrap init to configure the Android project for your PWA
npx @bubblewrap/cli init
# Build the Android package
npx @bubblewrap/cli build
```

2) Capacitor — wraps your web app in a native WebView. Example steps:

```bash
# Install Capacitor in the project
npm install --save @capacitor/core @capacitor/cli
npx cap init timesheet com.example.timesheet --web-dir=dist
npm run build
npx cap add android
npx cap open android
# Use Android Studio to build APK/AAB
```

Helper scripts are provided:
- `./scripts/package-twa.sh` — helper that builds and runs `npx @bubblewrap/cli init` interactively
- `./scripts/package-capacitor.sh` — helper to init Capacitor and open Android project

Remember: building APK/AAB requires a working Android SDK and Java/Android Studio on your machine. See the scripts for more details.
