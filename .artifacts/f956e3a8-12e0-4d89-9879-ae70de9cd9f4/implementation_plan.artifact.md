# Implementation Plan: Native Android Migration (Phase 1)

This plan details the migration of the AIEA app from a Capacitor-wrapped web app to a fully native Kotlin/Jetpack Compose app, focusing on the foundational architecture and authentication.

## User Review Required

> [!IMPORTANT]
> **Existing Android Project Transformation**: I will be modifying the existing `:app` module to remove Capacitor dependencies and transition it to a native Kotlin project.
> **Backend Integration**: The native app will connect to the existing Next.js API at `https://epireg-aiea.vercel.app/api/`.

## Phase 1: Foundational Architecture & Auth

### 1. Build System & Dependencies
*   **Modify `build.gradle` (Project)**: Add Hilt and Kotlin Serialization plugins.
*   **Modify `app/build.gradle`**:
    *   Enable Jetpack Compose.
    *   Add Room, Retrofit, WorkManager, DataStore, Hilt, Navigation, and Lifecycle dependencies.
    *   Remove Capacitor, Cordova, and legacy bridge dependencies.
*   **Update `variables.gradle`**: Define versions for the new stack.

### 2. Data Layer (Room & Repository)
*   **Room Entities**: Create `PatientEntity` and `EncounterEntity` mirroring the TypeScript types, including a `SyncStatus` field (PENDING_UPLOAD, SYNCED, SYNC_FAILED).
*   **Type Converters**: Implement converters for `List<String>` used in red flags and counseling points.
*   **Room Database**: Define `AieaDatabase` with DAOs for Patients and Encounters.
*   **Repository Layer**:
    *   `AuthRepository`: Manages user sessions via `DataStore`.
    *   `PatientRepository`: Reactive data access (Room-first) via Kotlin Flow.
    *   `EncounterRepository`: Handles local saves and triggers background sync.

### 3. Sync Engine (WorkManager)
*   **`UploadWorker`**:
    *   Triggered on network availability.
    *   Queries Room for `PENDING_UPLOAD` encounters.
    *   Calls `POST /api/encounters` with Bearer token.
    *   Updates Room to `SYNCED` on 2xx, or `SYNC_FAILED` on 400 (validation error).

### 4. Authentication (Compose)
*   **`AuthViewModel`**: State management for login status and credentials.
*   **`LoginScreen`**:
    *   Phone/Email toggle using a segmented control.
    *   Dynamic keyboard types (Phone vs Email).
    *   Calls `POST /api/auth/login`.
*   **`SplashScreen`**: Initial entry point to check `DataStore` for a valid session and route to Login or Dashboard.

---

## Verification Plan

### Automated Tests
*   **Room DAO Tests**: Verify local CRUD operations and query for pending sync items.
*   **Repository Tests**: Mock API responses to verify sync status transitions in Room.

### Manual Verification
1.  **Project Build**: Ensure the project builds successfully without Capacitor errors.
2.  **Authentication**:
    *   Test login with both Email and Phone modes.
    *   Verify token and user data are persisted in `DataStore`.
    *   Test "Keep me logged in" by killing and restarting the app.
3.  **Basic Sync Trigger**:
    *   Create a test record (manual Room entry for now).
    *   Verify `UploadWorker` is enqueued and attempts to sync.

---

## Phase 2 (Future)
*   CHW Dashboard, Patient Registration, and the full Offline-first Encounter Form.
