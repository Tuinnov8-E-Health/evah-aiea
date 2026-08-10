# Implementation Plan: Retirement of Capacitor Hybrid Setup

This plan outlines the steps to cleanly remove the Capacitor-related Gradle configurations and files from the `android/` module to transition to a fully native Kotlin/Compose architecture.

## Proposed Changes

### [Core Project Configuration]

#### [MODIFY] [settings.gradle](file:///C:/Users/hp/Desktop/Matakili/evah-aiea/android/settings.gradle)
- Remove `include ':capacitor-cordova-android-plugins'`.
- Remove `project(':capacitor-cordova-android-plugins').projectDir = ...`.
- Remove `apply from: 'capacitor.settings.gradle'`.

#### [DELETE] [capacitor.settings.gradle](file:///C:/Users/hp/Desktop/Matakili/evah-aiea/android/capacitor.settings.gradle)
- Delete the generated Capacitor settings file.

#### [DELETE] [capacitor.build.gradle](file:///C:/Users/hp/Desktop/Matakili/evah-aiea/android/app/capacitor.build.gradle)
- Delete the generated Capacitor build file.

## Verification Plan

### Automated Tests
- Run `gradle sync` to ensure the project structure is valid and all dependencies are resolved without Capacitor references.
- Run `:app:assembleDebug` to verify that the native app compiles successfully.

### Manual Verification
- Verify that the `:capacitor-cordova-android-plugins` module no longer appears in the Android Studio project view.
- Ensure that no `com.capacitor:*` or `@capacitor/android` dependencies remain in the build logs.
