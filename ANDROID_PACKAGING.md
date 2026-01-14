# Android PWA Packaging Guide

## Option 1: Trusted Web Activity (TWA) via Bubblewrap (Recommended)

TWA packages your PWA as a native Android app that wraps the web content. It's the simplest path for PWAs that meet Google Play requirements.

### Requirements
- Java Development Kit (JDK) 11+
- Android SDK (min API 24, target API 34+)
- `ANDROID_SDK_ROOT` or `ANDROID_HOME` environment variable set
- npm

### Steps

1. **Build the PWA**
   ```bash
   npm run build
   ```

2. **Install Bubblewrap globally (optional) or use npx**
   ```bash
   # Global install (optional):
   npm install -g @bubblewrap/cli
   ```

3. **Initialize TWA project**
   ```bash
   # Using our helper script (interactive):
   ./scripts/package-twa.sh
   
   # Or manually:
   npm run build
   npx @bubblewrap/cli init
   ```
   During init you'll be prompted for:
   - App URL: `https://your-domain.com` (or use `http://localhost:5174` for testing)
   - Package ID: e.g., `com.example.timesheet`
   - App name, display name, etc.

**Android permissions for geolocation (Capacitor)**

If you plan to use native geolocation with Capacitor, ensure your Android manifest includes the location permissions. Add the following to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` element:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

If you need background location (Android 10+), request `ACCESS_BACKGROUND_LOCATION` and ensure you follow Play Store privacy guidance.

4. **Build the APK**
   ```bash
   npx @bubblewrap/cli build
   ```
   This generates an `app-signed.aab` (App Bundle) and optionally an APK.

5. **Install on device/emulator**
   ```bash
   # If you have an Android device connected via adb:
   adb install path/to/app.apk
   ```

6. **Upload to Play Store** (optional)
   - Use the generated AAB (App Bundle) at `app-unsigned.aab` or `app-signed.aab`
   - Upload via Google Play Console

## Option 2: Capacitor

Capacitor wraps your web app in a native WebView and provides access to native plugins.

### Requirements
- Java + Android SDK
- Android Studio (recommended for building APK)
- npm

### Steps

1. **Install Capacitor**
   ```bash
   npm install --save @capacitor/core @capacitor/cli
   ```

2. **Initialize Capacitor**
   ```bash
   npx cap init timesheet com.example.timesheet --web-dir=dist
   ```
   (Replace `com.example.timesheet` with your desired package ID)

3. **Build web assets**
   ```bash
   npm run build
   ```

4. **Add Android platform**
   ```bash
   npx cap add android
   npx cap sync
   ```

5. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

6. **Build APK in Android Studio**
   - Select Build → Build Bundle(s) / APK(s)
   - Choose APK or App Bundle
   - Build and sign

7. **Install on device/emulator**
   ```bash
   adb install app-release.apk
   ```

## Comparison

| Feature | TWA (Bubblewrap) | Capacitor |
|---------|------------------|-----------|
| Native UI | No | No (WebView) |
| Ease of use | Very easy | Easy |
| Plugin support | Limited | Extensive |
| Size | Smaller | Larger |
| Play Store ready | Yes | Yes |

## Testing Before Publishing

1. **Test on emulator or device**
   ```bash
   # If using Capacitor:
   npx cap open android
   # Build and run from Android Studio
   
   # If using TWA:
   npx @bubblewrap/cli build
   adb install path/to/app.apk
   ```

2. **Verify app works offline**
   - Use the app, then toggle network offline
   - Service worker should serve cached pages/assets

3. **Check manifest installability**
   - Open Chrome DevTools on the device
   - Check Console for warnings about missing manifest fields

## Troubleshooting

### "Android SDK not found"
- Set `ANDROID_SDK_ROOT` or `ANDROID_HOME`:
  ```bash
  export ANDROID_HOME=/path/to/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

### Build fails with "Java not found"
- Install JDK 11+ and ensure `JAVA_HOME` is set:
  ```bash
  export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-arm64
  ```

### Service worker not caching
- Ensure HTTPS is used in production (localhost OK for dev)
- Check DevTools → Application → Service Workers

## More Resources
- [Bubblewrap docs](https://github.com/GoogleChromeLabs/bubblewrap)
- [Capacitor docs](https://capacitorjs.com)
- [PWA install criteria](https://web.dev/install-criteria/)
