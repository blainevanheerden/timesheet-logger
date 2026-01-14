#!/usr/bin/env bash
set -euo pipefail

# Helper script to initialize and build an Android app using Capacitor.
# Requires: Node/npm, Android SDK + Android Studio.

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required. Install Node/npm first." >&2
  exit 1
fi

# install capacitor if not present
npm install --save @capacitor/core @capacitor/cli || true

# Initialize Capacitor (adjust package id and app name)
npx cap init timesheet com.example.timesheet --web-dir=dist || true

# Build web assets
npm run build

# Add Android platform
npx cap add android || true

echo "Open the generated Android project in Android Studio: npx cap open android"