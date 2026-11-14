# Minimasters for Android

This folder packages the game for Google Play with [Capacitor](https://capacitorjs.com). The game files live one folder up and still run without any build. Here they are only copied into `www/` and wrapped in an Android app.

## Needs

- Node.js (LTS)
- JDK 21 (`JAVA_HOME`), for example Eclipse Temurin 21
- Android SDK (`ANDROID_HOME`) with the platform, build tools and platform-tools that Capacitor 8 asks for. Android Studio installs these too.

Run `npm install` here once.

## Commands

| Command | What it does |
|---|---|
| `npm run sync` | Copies the game into `www/` and updates the Android project. Run after every game change. |
| `npm run apk` | Builds a debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. |
| `npm run bundle` | Builds the signed Play Store bundle (needs the upload key, see below). |
| `npm run images` | Renders the SVG artwork into the icons, the splash screen and the store icon. |
| `npm run open` | Opens the project in Android Studio. |

Before each new Play Store upload, raise `versionCode` (and `versionName`) in `android/app/build.gradle`.

## Signing key (not created yet)

A release bundle needs an upload key. Create it once with `keytool`, keep it in `keys/` and its password in `android/keystore.properties`. Both are git-ignored on purpose. Copy the `keys/` folder somewhere safe. Horse Racer's `mobile/README.md` and `android/app/build.gradle` show the same setup.

## Install on your own phone without the Play Store

1. On the phone, turn on **Settings → About phone → tap Build number 7 times**, then **Developer options → USB debugging**.
2. Connect the phone with USB and run:

```bash
%ANDROID_HOME%\platform-tools\adb install -r android\app\build\outputs\apk\debug\app-debug.apk
```
