#!/usr/bin/env bash
set -euo pipefail

# Helper script to package the PWA as an Android TWA using Bubblewrap.
# This script requires:
# - Java + Android SDK (ANDROID_HOME or ANDROID_SDK_ROOT set)
# - npm (to have installed the PWA and build)
# - @bubblewrap/cli installed (this script will use npx if not installed globally)

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required. Install Node/npm first." >&2
  exit 1
fi

if [ -z "${ANDROID_SDK_ROOT:-}" ] && [ -z "${ANDROID_HOME:-}" ]; then
  echo "Android SDK not found. Set ANDROID_SDK_ROOT or ANDROID_HOME." >&2
  exit 1
fi

# Build the PWA
npm run build

# Initialize Bubblewrap project (interactive) - you can pass flags if you want non-interactive
echo "Starting Bubblewrap init... follow prompts to configure the TWA (enter your app URL, name, etc.)"
npx @bubblewrap/cli init

# After init you can run:
# npx @bubblewrap/cli build
# This will produce an Android project you can open in Android Studio and build an APK or App Bundle.

echo "Bubblewrap init finished. To build an Android package run: npx @bubblewrap/cli build"