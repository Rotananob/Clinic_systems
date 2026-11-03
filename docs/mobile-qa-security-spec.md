# KruPet Native Android Mobile App: QA, Security, and Google Play Store Compliance Blueprint
Document Identifier: MOBILE-QA-SECURITY-SPEC-2026-V1
Target Path: docs/mobile-qa-security-spec.md
Application Identifier: com.krupet.clinic
System Architecture: Native Android (Kotlin, Jetpack Compose, Coroutines, Room SQLCipher, Retrofit)
Backend Target: KruPet NestJS Enterprise Backend
Author: QA and Security Engineering Subagent

---

## 1. Executive Summary and Architecture Overview

### 1.1 Scope and Objective
The KruPet Mobile application extends the enterprise Clinic Patient Management PaaS into a native Android platform tailored for licensed physicians, clinical nurse specialists, pharmacists, and clinic owners. The mobile client provides offline-first bedside clinical decision support, pharmacotherapy calculation, digital prescription issuance, and edge synchronization with the central NestJS backend.

Because the application handles Protected Health Information (PHI), executes clinical decision algorithms, and operates within medical environments, it must meet stringent security, regulatory, and quality benchmarks prior to Google Play Store submission.

```
+----------------------------------------------------------------------------------------------------+
|                         KRUPET NATIVE ANDROID SYSTEM ARCHITECTURE                                  |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PRESENTATION LAYER - JETPACK COMPOSE ]                                                          |
|  - UI Components: Material 3, Biometric Auth Gate, Clinical Dashboard, Waveform Visualizer        |
|  - ViewModels: StateFlow, MVI Pattern, Scoped Coroutines, SavedStateHandle                        |
|                               |                                                                    |
|                               v                                                                    |
|  [ DOMAIN LAYER - PURE KOTLIN ]                                                                    |
|  - Clinical Engines: PediatricMath, ResuscitationMath, PkPdMath, ChemoMath, AspMath                |
|  - Use Cases: CalculateDoseUseCase, SyncEdgeDataUseCase, AuthenticateBiometricUseCase              |
|  - Strict Isolation: Zero Android framework dependencies in clinical calculation logic            |
|                               |                                                                    |
|                               v                                                                    |
|  [ DATA & REPOSITORY LAYER ]                                                                       |
|  - Offline Store: Room + SQLCipher 256-bit AES, Vector Clocks, WorkManager Queue                   |
|  - Secure Storage: Jetpack Security EncryptedSharedPreferences (MasterKey AES-256-GCM)             |
|  - Network Client: OkHttp 4 + TLS 1.3, Certificate Pinning, Retrofit 2 + Moshi                     |
|                               |                                                                    |
|                               v                                                                    |
|  [ SECURE TRANSPORT LAYER ] ---> TLS 1.3 Pinning ---> KruPet NestJS Cloud Backend (/api/v1)        |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.2 Storage and Build Environment Constraints
Physical Host Drive C has strictly limited free space (under 770 MB remaining). The build and test toolchain must operate without allocating build outputs, caches, or SDK files on Drive C:
- Android SDK Root: Strictly `d:\Android\Sdk`
- Gradle User Home: Strictly `d:\.gradle`
- Android AVD and Emulator Storage: Strictly `d:\Android\.android`
- Workspace Repository: Strictly `d:\WEB Development\clinic-patient-management\mobile`

---

## 2. Google Play Store Policy and Security Compliance

### 2.1 Google Play Health Content and Services Policy
KruPet Mobile falls under the Google Play Health Apps category as a clinical practice management and medical reference tool. To comply with Google Play Health policies:

1. Target Audience Declaration:
   - Exclusively intended for licensed healthcare professionals and authorized clinical staff.
   - Clinical calculations are advisory decision-support tools; final clinical judgment remains with the attending physician.
2. Clinical Disclaimers:
   - Non-SaMD (Software as a Medical Device) declaration: The application calculates drug dosages based on validated peer-reviewed medical formulas (AAP 2022, Harriet Lane, ATLS, Baxter Parkland). It does not directly control infusion hardware or diagnostic sensors on consumer devices.
3. Institutional Credentialing:
   - Requires registered clinic tenant credentials approved by the KruPet Super Admin. Public self-registration without clinic affiliation is prohibited.

### 2.2 Data Safety Section and PHI Handling
In compliance with Google Play Data Safety requirements and HIPAA/GDPR clinical confidentiality standards:

| Data Element | Category | Purpose | In Transit | At Rest | Third-Party Sharing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient Full Name** | Personal Info | Patient Identification | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | None |
| **National ID / Khmer ID** | Personal Info | Legal Health Identification | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | MoH / NSSF Statutory Only |
| **Date of Birth & Age** | Personal Info | Pediatric & Adult Dosing | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | None |
| **Clinical Vitals & Notes** | Health Info | Medical Record & SOAP | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | None |
| **Prescription History** | Health Info | Pharmacy Dispensation | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | None |
| **Diagnostic Images** | Photos & Media | PACS DICOM Teleconsult | Encrypted (TLS 1.3) | Encrypted (SQLCipher) | None |
| **Authentication Tokens** | Account Info | User Session & RBAC | Encrypted (TLS 1.3) | EncryptedSharedPreferences | None |

Data Retention and Deletion:
- Clinicians and patients have the legal right to request complete account and data removal through the app settings or via the web portal at `/settings/privacy`.
- Data deletion requests are queued and cryptographically processed within 30 days per statutory healthcare data retention regulations.

### 2.3 Cryptographic Standards: At-Rest and In-Transit
#### 1. In-Transit Encryption
- Transport Layer Security: Strict TLS 1.3 with fallback to TLS 1.2 only. Cleartext HTTP traffic is disabled system-wide via Android Manifest:
```xml
android:usesCleartextTraffic="false"
```
- Certificate Pinning: Network security config enforces SHA-256 certificate pinning against KruPet cloud and edge gateway domains.

#### 2. At-Rest Encryption (SQLCipher Room)
- Local Room database is encrypted using SQLCipher with 256-bit AES in CBC mode with 64,000 PBKDF2 iterations.
- Database passphrase is generated using `java.security.SecureRandom`, encrypted via Android Keystore MasterKey, and stored in `EncryptedSharedPreferences`.

#### 3. Key-Value Storage (EncryptedSharedPreferences)
- Session tokens, refresh tokens, and user credentials use Jetpack Security `EncryptedSharedPreferences`:
  * Key encryption scheme: `AES256_SIV`
  * Value encryption scheme: `AES256_GCM`
  * MasterKey provider: Hardware-backed Android Keystore with StrongBox Keymaster where available.

### 2.4 ProGuard and R8 Optimization Rules
Aggressive code optimization must never alter mathematical floating-point precision, reflection-based JSON serializers, or cryptographic hashes:

```proguard
# KruPet ProGuard / R8 Configuration

# 1. Preserve Clinical Calculation Engines and Pure Kotlin Models
-keep class com.krupet.clinic.core.math.** { *; }
-keepclassmembers class com.krupet.clinic.core.math.** {
    public static <methods>;
    public <methods>;
}

# 2. Preserve Data Transfer Objects and JSON Serialization
-keepattributes Signature
-keepattributes *Annotation*
-keep @com.squareup.moshi.JsonClass class * { *; }
-keepclassmembers class * {
    @com.squareup.moshi.Json(name = *) <fields>;
}

# 3. Preserve Room Database & SQLCipher
-keep class * extends androidx.room.RoomDatabase
-keep class * extends androidx.room.RoomDatabase$Callback
-keep class net.sqlcipher.** { *; }
-dontwarn net.sqlcipher.**

# 4. Strip Diagnostic Logging in Release Builds
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}

# 5. Prevent Recomposition Obfuscation Issues
-keep class * extends androidx.compose.runtime.State { *; }
```

### 2.5 Biometric Authentication and Session Timeout Policies
- Biometric Prompt API: Utilizes `androidx.biometric.BiometricPrompt` with `BIOMETRIC_STRONG` (Class 3 hardware biometric sensors).
- Fallback Authentication: If biometric hardware is absent, enrolled credentials fail, or sensor error occurs, fallback to device PIN/Pattern/Password or clinic-assigned 6-digit security PIN.
- Session Inactivity Lock:
  * If the app is moved to background for more than 300 seconds (5 minutes), the secure screen overlay activates, requiring biometric re-authentication.
  * Accessing narcotics registration, chemotherapy ordering, or MTP emergency protocols mandates an immediate step-up authentication.
- Screen Capture Protection:
  * All clinical activities enforce `FLAG_SECURE` on `Window` instances to block screenshots, screen recording, and task-switcher previews containing patient PHI:
```kotlin
window.setFlags(
    WindowManager.LayoutParams.FLAG_SECURE,
    WindowManager.LayoutParams.FLAG_SECURE
)
```

---

## 3. Test Strategy and Quality Gates

### 3.1 Overview of Quality Gates
Every Pull Request and release candidate must pass four automated verification gates:

```
+----------------------------------------------------------------------------------------------------+
|                                    AUTOMATED QUALITY GATES                                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ GATE 1: KOTLIN CLINICAL UNIT TESTS ]                                                            |
|  - Pure Kotlin JVM tests executing in < 15 seconds                                                 |
|  - 100% mathematical parity with backend NestJS engines                                            |
|  - 0 Android framework dependencies                                                                |
|                               |                                                                    |
|                               v                                                                    |
|  [ GATE 2: ROBOLECTRIC STATE & VIEWMODEL TESTS ]                                                   |
|  - Fast headless testing of StateFlow, MVI events, and Compose UI trees                            |
|  - Runs on JVM without emulator or hardware device                                                 |
|  - Drive C allocation: 0 MB                                                                        |
|                               |                                                                    |
|                               v                                                                    |
|  [ GATE 3: RETROFIT CONTRACT & MOCKWEBSERVER TESTS ]                                               |
|  - Verifies exact DTO schema parity with NestJS backend routes                                     |
|  - Simulates HTTP 200, 400, 401, 403, 404, 422, 429 error scenarios                                |
|                               |                                                                    |
|                               v                                                                    |
|  [ GATE 4: REGEX COMPLIANCE & ZERO EMOJI AUDIT ]                                                   |
|  - Strictly 0 emojis in code, resources, or strings                                                |
|  - Strictly 0 parentheses in Khmer strings (values-km/strings.xml)                                 |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

### 3.2 Clinical Unit Tests in Kotlin (JUnit 5 / Kotest)
Clinical algorithms are written in pure Kotlin with zero Android dependencies, enabling sub-second execution on any developer machine.

#### Test Specification Matrix
1. Pediatric Precision Dosing:
   - Weight-based calculation for Paracetamol 15 mg/kg (60 kg child -> 900 mg; 75 kg child -> 1,000 mg adult cap).
   - Historical rules: Clark, Young, Fried formulas matching exact mathematical benchmarks.
2. Neonatal Aminoglycoside Regimen:
   - Postmenstrual age (PMA) calculation: PMA = GA + (PNA / 7).
   - Interval allocation: PMA < 30w -> 5.0 mg/kg q48h; PMA 30-34w PNA <= 7d -> 4.5 mg/kg q36h; PMA 30-34w PNA > 7d -> 4.0 mg/kg q24h.
3. AAP 2022 Hyperbilirubinemia Nomogram:
   - Bhutani curve interpolation across hours 12 to 168.
   - Triggers for Low, Medium, High risk tiers and action escalation (Continue Care, Monitor 12h, Standard Phototherapy, Intensive Phototherapy, Exchange Transfusion).
4. Emergency Sepsis and Resuscitation:
   - qSOFA calculation (RR >= 22, GCS < 15, SBP <= 100).
   - Full 6-organ SOFA score (0-24) and projected mortality.
   - Surviving Sepsis Hour-1 crystalloid bolus: 30 mL/kg over 3 hours.
   - Serial lactate clearance kinetics: ((Baseline - Repeat) / Baseline) * 100%.
   - Baxter Parkland formula: 4 mL * kg * % TBSA (50% first 8h, 50% next 16h) with dynamic UOP titration.
   - Pediatric Broselow 9-color mapping, ETT sizing, defibrillation joules, and emergency drugs.
   - Shock Index (HR / SBP) and ABC score (0-4) with Tranexamic Acid (TXA) 3-hour hard gate.

```kotlin
// Example Kotlin Clinical Test: Pediatric & Resuscitation Parity
package com.krupet.clinic.core.math

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName

class ClinicalMathEngineTest {

    @Test
    @DisplayName("Should clamp pediatric Paracetamol dose to adult ceiling of 1000 mg for overweight child")
    fun testPediatricParacetamolDoseClamping() {
        // 60 kg child at 15 mg/kg = 900 mg (under 1000 mg cap)
        val normalChild = PediatricMathEngine.calculateWeightBasedDose(
            weightKg = 60.0,
            doseMgPerKg = 15.0,
            adultMaxSingleDoseMg = 1000.0
        )
        assertEquals(900.0, normalChild.finalCappedDoseMg)
        assertFalse(normalChild.isCapped)

        // 75 kg child at 15 mg/kg = 1125 mg -> clamped to 1000 mg
        val overweightChild = PediatricMathEngine.calculateWeightBasedDose(
            weightKg = 75.0,
            doseMgPerKg = 15.0,
            adultMaxSingleDoseMg = 1000.0
        )
        assertEquals(1000.0, overweightChild.finalCappedDoseMg)
        assertTrue(overweightChild.isCapped)
    }

    @Test
    @DisplayName("Should calculate Parkland Burn Formula: 70 kg, 40% TBSA -> 11200 mL total")
    fun testParklandFormula() {
        val burn = ResuscitationMathEngine.calculateParkland(
            weightKg = 70.0,
            tbsaPercentage = 40.0,
            hoursSinceInjury = 0.0
        )
        assertEquals(11200, burn.total24HourFluidMl)
        assertEquals(5600, burn.first8HourTotalMl)
        assertEquals(700, burn.first8HourHourlyRateMlH)
        assertEquals(350, burn.next16HourHourlyRateMlH)
    }

    @Test
    @DisplayName("Should enforce hard medical block on TXA when injury elapsed time exceeds 3 hours")
    fun testTxaHardTimeGate() {
        val approved = ResuscitationMathEngine.evaluateMtp(
            heartRate = 125,
            systolicBp = 85,
            isPenetrating = true,
            fastPositive = true,
            hoursSinceInjury = 2.0
        )
        assertTrue(approved.txaIndicated)
        assertEquals("GIVE_IMMEDIATELY", approved.txaStatus)

        val blocked = ResuscitationMathEngine.evaluateMtp(
            heartRate = 125,
            systolicBp = 85,
            isPenetrating = true,
            fastPositive = true,
            hoursSinceInjury = 3.5
        )
        assertFalse(blocked.txaIndicated)
        assertEquals("CONTRAINDICATED_WINDOW_EXCEEDED", blocked.txaStatus)
    }
}
```

---

### 3.3 Robolectric Headless Compose & ViewModel Testing
Robolectric executes Android framework code on the local JVM without starting an Android emulator, preserving CPU, RAM, and Drive C storage.

Key Capabilities Tested via Robolectric:
1. ViewModel StateFlow Transitions: Emission of `Loading -> Success(data)` or `Loading -> Error(message)`.
2. Biometric State Machine: Verification that backgrounding transitions UI state to `ScreenLocked`.
3. Offline Queue Dispatcher: Room database entity insertion and WorkManager enqueuing.
4. Compose UI Interaction: Node finding, text field input, button click assertion, and recomposition verification via `createComposeRule()`.

```kotlin
// Robolectric Headless Test Example
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class SepsisViewModelRobolectricTest {

    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun testQsofaHighRiskAlertTrigger() = runTest {
        val viewModel = SepsisViewModel(mathEngine = ResuscitationMathEngine())
        
        viewModel.onRespiratoryRateChanged("26")
        viewModel.onGlasgowComaScaleChanged("13")
        viewModel.onSystolicBpChanged("90")
        
        val state = viewModel.uiState.value
        assertEquals(3, state.qsofaScore)
        assertTrue(state.isHighRisk)
        assertTrue(state.alertBannerVisible)
    }
}
```

---

### 3.4 API Contract Verification: Retrofit against NestJS Backend
The mobile Retrofit API interfaces must maintain 100% schema parity with existing NestJS REST controllers.

Contract Test Verification Protocol:
1. Endpoints Tested via `MockWebServer`:
   - `POST /api/auth/login` -> AuthTokenResponseDto
   - `POST /api/pediatric/calculate-dosing` -> PediatricDosingCalculationDto
   - `POST /api/pediatric/neonatal-gentamicin` -> NeonatalAminoglycosideDosingDto
   - `POST /api/pediatric/evaluate-phototherapy` -> PhototherapyNomogramAssessmentDto
   - `POST /api/resuscitation/evaluate-sepsis` -> SepsisAssessmentResultDto
   - `POST /api/resuscitation/calculate-parkland` -> ParklandBurnCalculationDto
   - `POST /api/resuscitation/evaluate-mtp` -> MtpAssessmentResultDto
   - `POST /api/sync/pull` & `POST /api/sync/push` -> VectorClockSyncBatchDto
2. Verification Matrix:
   - Valid JSON payloads must parse into strongly typed Kotlin data classes without nullability exceptions.
   - Unexpected extra fields in backend response must be ignored safely without crash.
   - HTTP 401 Unauthorized must trigger automatic token refresh via OkHttp `Authenticator`.
   - HTTP 429 Rate Limited must parse retry headers and show user-friendly non-blocking notification.

---

### 3.5 Offline Edge Sync and Conflict Resolution Scenarios
The mobile application operates reliably in rural health posts and hospital basements with intermittent connectivity:

```
+----------------------------------------------------------------------------------------------------+
|                                OFFLINE SYNC WORKFLOW & CONFLICT LOGIC                              |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL MUTATION TRIGGERED ON MOBILE ]                                                         |
|  1. Generate local mutation record in Room DB                                                      |
|  2. Increment branch/device vector clock: V_mobile[device_id] += 1                                  |
|  3. Enqueue WorkManager sync task with EXPONENTIAL backoff                                         |
|                               |                                                                    |
|                               v                                                                    |
|  [ NETWORK CONNECTIVITY RESTORED ]                                                                 |
|  4. Push delta batch to NestJS backend: POST /api/sync/push                                        |
|  5. Backend compares vector clocks:                                                                |
|     - Case A: V_mobile dominates V_cloud -> Clean merge, update cloud state                         |
|     - Case B: V_cloud dominates V_mobile -> Overwrite mobile with cloud state                       |
|     - Case C: V_mobile || V_cloud (Concurrent / Split-Brain) ->                                    |
|       * Deterministic LWW (Last-Write-Wins) timestamp tie-breaker for vitals                       |
|       * Mandatory Dual-Signoff Flag for narcotic logs & prescription edits                         |
|  6. Pull remote updates: POST /api/sync/pull                                                       |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

#### Sync Test Scenarios
1. Offline Creation: Create 10 clinical encounter records in airplane mode. Verify they persist in encrypted Room DB. Re-enable network; verify all 10 sync to backend with status 200.
2. Concurrent Edits: Edit prescription notes on mobile device while partitioned, and simultaneously edit on web portal. On sync, verify conflict resolution logic executes without data loss.
3. Network Flapping: Rapidly toggle network connectivity during large sync batch. Verify transaction atomicity in Room and zero duplicate records on backend.

---

## 4. Performance Metrics and Quality Standards

### 4.1 Cold Startup Optimization (<800ms)
- Benchmark Target: Cold start from process creation to first meaningful interactive frame under 800 milliseconds on mid-range Android hardware (Snapdragon 680 / 4GB RAM).
- Implementation Blueprint:
  1. Baseline Profiles: Generate release baseline profiles using `androidx.benchmark.macro.junit4` to pre-compile critical execution paths into AOT (Ahead-Of-Time) machine code.
  2. Jetpack App Startup: Initialize Room DB, SQLCipher libraries, and WorkManager via `androidx.startup.InitializationProvider` in parallel coroutines.
  3. Defer Heavy Services: Telemetry WebSocket drivers, DICOM renderers, and background sync workers are initialized lazily upon navigating to their respective modules.

### 4.2 Memory Management (<90MB Baseline)
- Benchmark Target: Active memory footprint under 90MB during standard clinical chart review, vital entry, and prescription editing.
- Peak Memory Limit: Under 180MB when rendering multi-lead arrhythmia waveforms or high-resolution clinical images.
- Memory Control Rules:
  * Image Loading: Use Coil with hardware bitmap allocation and automatic downsampling matching target ImageView dimensions.
  * Waveform Buffers: Circular ring buffers (`FloatArray`) with fixed capacity (e.g. 5 seconds at 250 Hz = 1,250 points) preventing continuous object allocations during 60 FPS canvas redraws.
  * Memory Leak Prevention: Strict zero-leak policy enforced via LeakCanary in debug builds. No static references to `Context`, `Activity`, or `View`.

### 4.3 Zero Frame Drops and 60Hz / 120Hz Smooth Rendering
- Benchmark Target: Zero dropped frames (jank rate < 1.0%) during rapid fling scrolling of patient lists, drug formulary catalogs, and clinical logs.
- Compose Optimization Rules:
  1. Immutability Annotations: All domain and UI model classes must be annotated with `@androidx.compose.runtime.Immutable` or `@androidx.compose.runtime.Stable`.
  2. Lambdas in LazyLists: Pass method references or remember lambdas to prevent unnecessary sub-tree recompositions:
     ```kotlin
     // Compliant
     val onPatientClick = remember(patient.id) { { viewModel.selectPatient(patient.id) } }
     ```
  3. Stable Keys: Every item in `LazyColumn` or `LazyRow` must specify a unique, immutable key:
     ```kotlin
     items(
         items = state.patientList,
         key = { patient -> patient.id },
         contentType = { "patient_card" }
     ) { patient ->
         PatientCard(patient = patient)
     }
     ```
  4. Derived State: Frequent calculation inputs (e.g. search filtering, scroll position triggers) must use `derivedStateOf`.

---

## 5. Physical Host Drive C Protection & Build Configurations

### 5.1 Relocation of SDK, Gradle, and Caches to Drive D
Because Drive C has less than 770 MB remaining, standard installation paths will cause immediate disk exhaustion and OS failure. The following configuration must be strictly configured:

#### 1. System Environment Variables (Persistent on Drive D)
```powershell
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "d:\Android\Sdk", "User")
[System.Environment]::SetEnvironmentVariable("ANDROID_USER_HOME", "d:\Android\.android", "User")
[System.Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", "d:\.gradle", "User")
```

#### 2. Project `gradle.properties` (mobile/gradle.properties)
```properties
# Relocate Gradle build cache and user home away from Drive C
gradle.user.home=d:/.gradle
org.gradle.caching=true
org.gradle.parallel=true
org.gradle.daemon=true
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:+UseG1GC

# Android Gradle Plugin settings
android.useAndroidX=true
android.enableJetifier=false
android.nonTransitiveRClass=true
```

#### 3. Project `local.properties` (mobile/local.properties)
```properties
sdk.dir=d\:\\Android\\Sdk
```

---

## 6. Strict Language, Localization, and Formatting Compliance

### 6.1 Zero Emojis Policy
- Strictly ZERO emojis in all Kotlin code, comments, string resources, test suites, commit messages, and documentation.
- Automated CI check regex:
  ```regex
  [\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]
  ```

### 6.2 Zero Khmer Parentheses Policy
- In Khmer typography and official Ministry of Health documentation, Western parentheses `(` and `)` are strictly prohibited.
- Acceptable separators: hyphens `-`, colons `៖`, commas `,`, or spaces.
- Validation regex for Khmer strings:
  ```regex
  [\u1780-\u17FF].*[()]
  ```
- Any string matching this pattern fails the automated build gate.

#### Bilingual String Resource Examples (Compliant vs Non-Compliant)
```xml
<!-- English Resource: res/values/strings.xml -->
<string name="dose_clamped_notice">Dose clamped at adult maximum ceiling of %1$s mg to prevent toxicity.</string>
<string name="parkland_first_8h">First 8 Hours Infusion Rate: %1$s mL/h</string>
<string name="txa_contraindicated">Tranexamic Acid Contraindicated: Elapsed time exceeds 3 hours.</string>

<!-- Khmer Resource: res/values-km/strings.xml (ZERO Parentheses, ZERO Emojis) -->
<!-- Non-Compliant Example (REJECTED): កម្រិតថ្នាំ (Paracetamol) ត្រូវបានកំណត់ត្រឹម 1000 mg -->
<!-- Compliant Example (APPROVED): -->
<string name="dose_clamped_notice">កម្រិតថ្នាំត្រូវបានកំណត់ត្រឹមពិដានអតិបរមារបស់មនុស្សពេញវ័យ %1$s mg ដើម្បីការពារការពុលថ្នាំ</string>
<string name="parkland_first_8h">ល្បឿនបញ្ចូលសេរ៉ូមក្នុងរយៈពេល ៨ ម៉ោងដំបូង៖ %1$s mL ក្នុងមួយម៉ោង</string>
<string name="txa_contraindicated">មិនអនុញ្ញាតឱ្យប្រើ TXA ឡើយ៖ ពេលវេលាក្រោយរបួសលើសពី ៣ ម៉ោង</string>
```

---

## 7. QA Security Signoff and Release Checklist

Prior to promoting any mobile build to Google Play Internal Testing or Production track, the QA Lead must certify:

- [ ] Google Play Health Content declaration completed with clinical disclaimer.
- [ ] Data Safety Form submitted matching actual collection endpoints.
- [ ] SQLCipher 256-bit database encryption verified with dynamic master key.
- [ ] `FLAG_SECURE` active on all clinical activities preventing screenshot leaks.
- [ ] Inactivity timeout of 300 seconds triggers biometric authentication lock.
- [ ] ProGuard / R8 rules verified: zero mathematical precision loss in clinical engines.
- [ ] Kotlin unit tests pass 100% across all pediatric, resuscitation, and dosing engines.
- [ ] Robolectric tests pass 100% for all ViewModel state transitions.
- [ ] Retrofit contract tests confirm 100% schema match with NestJS backend.
- [ ] Cold start benchmark < 800ms verified with Baseline Profiles.
- [ ] Memory footprint baseline < 90MB verified under LeakCanary.
- [ ] Build environment strictly isolates caches and SDK to Drive D (`d:\Android\Sdk`, `d:\.gradle`).
- [ ] Automated regex scan confirms strictly 0 emojis across all files.
- [ ] Automated regex scan confirms strictly 0 parentheses in Khmer strings (`values-km/strings.xml`).
- [ ] Git safety: Zero `git push` executed.
