# KruPet Clinical Mobile Architecture and Engineering Specification
Document Identifier: KRUPET-MOBILE-ARCH-SPEC-2026-V1
Application Identity: KruPet Clinical Mobile (Package: com.krupet.clinic)
Target Platform: Android 15 (API 35), Minimum SDK: Android 8.0 (API 26)
Compliance Standards: Material Design 3, Clean Architecture, HL7 FHIR R4, EMVCo KHQR Standard, DICOM PS 3.x, HIPAA Security Rule
Classification: Enterprise Standard Medical Clinical Decision Support and Hospital Management Mobile Client

---

## 1. Executive Summary and Architecture Overview

### 1.1 Clinical and Operational Rationale
The KruPet Clinical Mobile Application delivers a mission-critical, enterprise-grade native Android client for doctors, nurses, triage officers, and clinical pharmacists in hospital wards, intensive care units, emergency departments, and outpatient clinics. Directly interfaced with the NestJS backend and local edge nodes, the app guarantees full clinical operational parity, rapid real-time telemetry, and resilient offline capabilities.

The architecture strictly adheres to Android Clean Architecture and MVI/MVVM design patterns, powered by Jetpack Compose for declarative, deterministic UI rendering.

```
+----------------------------------------------------------------------------------------------------+
|                         KRUPET CLINICAL MOBILE ARCHITECTURE OVERVIEW                               |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ PRESENTATION LAYER - JETPACK COMPOSE MVI ]                                                      |
|  - Material 3 Medical Design System: Deep Teal (#006A6A), Medical Slate, Crisp White                |
|  - Strictly Zero AI Vibe: Crisp clinical contrast, zero neon glows, zero whimsical clutter         |
|  - Screens: Triage, Resuscitation, Pediatrics, OPD Queue, IPD Ward, Pharmacy POS, PACS DICOM        |
|  - ViewModels expose StateFlow<UiState> and handle UiIntent via Channel<UiEffect>                   |
|                               |                                                                    |
|                               v                                                                    |
|  [ DOMAIN LAYER - PURE KOTLIN USE CASES ]                                                          |
|  - CalculateSepsisHour1BundleUseCase, CalculateParklandBurnUseCase, CalculateBroselowUseCase       |
|  - EvaluateAAPNomogramUseCase, GenerateKhqrDeepLinkUseCase, RenderDicomSliceUseCase                |
|  - Enforces Inviolable Business Logic, Pediatric Dose Ceilings, and Narcotic Witness Sign-offs     |
|                               |                                                                    |
|                               v                                                                    |
|  [ DATA LAYER - REPOSITORIES, NETWORK & PERSISTENCE ]                                              |
|  - Remote: Retrofit 2 + OkHttp 4 (AuthInterceptor, TokenAuthenticator, Strict Network Security)   |
|  - Local: Room Database 2.6 (Encrypted SQLCipher, PatientDao, VitalsDao, OfflineMutationDao)       |
|  - KeyStore: EncryptedSharedPreferences (AES-256-GCM JWT tokens, Biometric PIN fallback)          |
|  - Sync Engine: WorkManager CoroutineWorker with Exponential Backoff & CRDT Vector Clock merge     |
|                               |                                                                    |
|                               v                                                                    |
|  [ NESTJS BACKEND API / EDGE CLINIC FLEET NODES ]                                                  |
|  - RESTful Endpoints, Server-Sent Events (SSE), WebSocket Telemetry, DICOM WADO-RS PACS Server     |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Workspace and Environment Isolation on Drive D

### 2.1 Critical Disk Space Guard
The host development workstation has strictly 770 MB of free storage remaining on Drive C. To avoid fatal system drive exhaustion and build crashes, all Android SDK components, Gradle user homes, build caches, and emulator images must reside strictly on Drive D.

### 2.2 Global Environment and Toolchain Configuration

#### 1. System Environment Variables (Persistent on Workstation):
- `ANDROID_HOME` = `d:\Android\Sdk`
- `ANDROID_USER_HOME` = `d:\Android\.android`
- `GRADLE_USER_HOME` = `d:\.gradle`
- `JAVA_HOME` = `d:\Android\jdk-17`

#### 2. Project-Level `local.properties` Configuration:
```properties
## d:\WEB Development\clinic-patient-management\mobile\local.properties
sdk.dir=d\:\\Android\\Sdk
```

#### 3. Root `gradle.properties` Performance and Directory Relocation:
```properties
## d:\WEB Development\clinic-patient-management\mobile\gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+UseG1GC
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true
android.useAndroidX=true
android.enableJetifier=false

# Redirect Gradle build cache strictly away from Drive C
android.buildCacheDir=d:\\.gradle\\build-cache
```

---

## 3. Medical Design System and Material 3 Palette

### 3.1 Design Philosophy: Pure Medical Precision
The UI adheres strictly to an evidence-based clinical aesthetic:
- Dominant Palette: Deep Teal (`#006A6A`), Medical Slate, and Crisp White cards.
- High Contrast Ratios: Every text element satisfies WCAG 2.1 Level AAA requirements ($\ge 7.0:1$ for normal clinical text, $\ge 4.5:1$ for large numbers and vital sign displays) to ensure readability in glare-intensive emergency rooms and dimly lit night wards.
- Zero AI Vibe: Strictly forbidden: dark neon glows, playful floating widgets, decorative gradient meshes, or ambiguous conversational placeholders. The UI is built for immediate clinical ergonomics: structured data grids, high-visibility alarm tags, clear progress bars, and prominent confirmation sheets.

### 3.2 Material 3 Color Tokens
```
+--------------------------+------------+-------------------------------------------------------------+
| Token Name               | Hex Code   | Clinical Usage Context                                      |
+--------------------------+------------+-------------------------------------------------------------+
| Primary Deep Teal        | #006A6A    | Header bars, primary action buttons, active navigation      |
| On Primary               | #FFFFFF    | Text and icons rendered atop Deep Teal                      |
| Primary Container        | #9AF0E9    | Highlighting active selected items, focus badges           |
| On Primary Container     | #002020    | Text rendered inside primary container badges               |
| Medical Slate Dark       | #3F4948    | Subtitles, metadata labels, structural dividers             |
| Medical Slate Light      | #496362    | Neutral containers, inactive tab indicators                 |
| Surface Crisp White      | #FFFFFF    | Card backgrounds, clinical data sheet surfaces              |
| Surface Background       | #F4FBF9    | App background canvas - ultra-soft anti-glare clinical tint |
| Surface Variant          | #DAE5E3    | Input field backgrounds, table row alternating tint         |
| Outline Border           | #6F7978    | Card borders, text field stroke boundaries                  |
| Critical Alarm Red       | #BA1A1A    | ESI-1 triage, MTP trigger, lethal arrhythmia alerts         |
| Urgent Orange            | #C25E00    | ESI-2 triage, Parkland rate adjustments, sepsis holds       |
| Stable Normal Green      | #006E1C    | Normal vitals, successful sync, approved prescriptions      |
+--------------------------+------------+-------------------------------------------------------------+
```

### 3.3 Bilingual Typography System (Khmer and Latin)
- Khmer Typography: Primary font family `Kantumruy Pro` (modern sans-serif) with fallback to `Battambang`. Line heights are enforced at $1.5\times$ to $1.6\times$ font size with `includeFontPadding = false` to prevent clipping of upper/lower Khmer vowel diacritics and consonant subscripts.
- Latin Typography: `Roboto` / `Inter` for clean, unambiguous clinical numeric figures and metric units.

```kotlin
// Compose Typography Definition
val MedicalTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = LatinFontFamily,
        fontWeight = FontWeight.Bold,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    ),
    titleLarge = TextStyle(
        fontFamily = KhmerFontFamily,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 30.sp, // Explicit 1.5x line height for Khmer script
        letterSpacing = 0.15.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = KhmerFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp
    ),
    labelSmall = TextStyle(
        fontFamily = LatinFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 16.sp
    )
)
```

---

## 4. Multi-Module Project Architecture

The mobile application is structured as a scalable, decoupled Gradle multi-module project to minimize build times and enforce unidirectional dependency flow:

```
                                  :app
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
     :feature:auth            :feature:triage          :feature:resuscitation
     :feature:pediatrics      :feature:ward            :feature:pharmacy
     :feature:pacs            :feature:teleconsult
          |                         |                         |
          +-------------------------+-------------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
          v                         v                         v
     :core:model              :core:network             :core:database
     :core:designsystem       :core:security            :core:sync
```

### Module Directory Breakdown:
1. `:app` - Application bootstrap, Hilt dependency injection root, navigation graph compilation, ProGuard packaging.
2. `:core:model` - Pure Kotlin data classes: `Patient`, `Vitals`, `TriageRecord`, `Prescription`, `LabResult`, `DicomStudy`.
3. `:core:network` - Retrofit 2 interfaces, OkHttp client, SSE listener, WebSocket telemetry client, network security certificates.
4. `:core:database` - Room database entities, DAOs, TypeConverters, SQLCipher encryption, migration scripts.
5. `:core:security` - BiometricPrompt manager, Android Keystore AES-GCM-256 wrappers, JWT decoder, secure memory wiper.
6. `:core:designsystem` - Material 3 theme, Deep Teal color tokens, Khmer font loaders, custom clinical components (VitalsCard, EsiBadge, WaveformView).
7. `:core:sync` - WorkManager offline sync engine, mutation queue manager, conflict resolution algorithms.
8. `:feature:*` - Self-contained UI features containing Compose screens, ViewModels, and UseCases.

---

## 5. Presentation Layer: Jetpack Compose MVI Pattern

The presentation layer utilizes the Model-View-Intent (MVI) architectural pattern with Kotlin Coroutines and `StateFlow`:
- Immutable `UiState`: Represents the single source of truth for the screen at any instant.
- `UiIntent` / `UiEvent`: User interactions or hardware triggers dispatched from Compose composables to the ViewModel.
- `UiEffect`: Single-shot events (e.g., navigation commands, emergency audible alerts, error snackbars) transmitted via `Channel<UiEffect>`.

```kotlin
// Example Triage MVI Architecture
data class TriageUiState(
    val isLoading: boolean = false,
    val patient: Patient? = null,
    val heartRate: Int = 0,
    val systolicBp: Int = 0,
    val calculatedEsiLevel: Int? = null,
    val shockIndex: Float = 0.0f,
    val isOccultShock: Boolean = false,
    val validationErrors: List<String> = emptyList()
)

sealed interface TriageUiIntent {
    data class UpdateHeartRate(val hr: Int) : TriageUiIntent
    data class UpdateBloodPressure(val sbp: Int, val dbp: Int) : TriageUiIntent
    data object CalculateTriageSeverity : TriageUiIntent
    data object SubmitTriageRecord : TriageUiIntent
}

sealed interface TriageUiEffect {
    data class NavigateToResuscitation(val patientId: String) : TriageUiEffect
    data class ShowToast(val message: String) : TriageUiEffect
}
```

---

## 6. Domain Layer: Clinical Use Cases

All clinical mathematics, safety bounds, and decision algorithms are implemented as pure, framework-independent Kotlin UseCases:

```
+------------------------------------+----------------------------------------------------------------+
| Clinical UseCase                   | Algorithmic Scope & Core Mathematics                           |
+------------------------------------+----------------------------------------------------------------+
| CalculateSepsisBundleUseCase       | Evaluates qSOFA and full SOFA score. Calculates 30 mL/kg       |
|                                    | balanced crystalloids and Norepinephrine titration targets.    |
|                                    |                                                                |
| CalculateParklandBurnUseCase       | Evaluates %TBSA via Rule of Nines. Computes 4 mL * kg * %TBSA   |
|                                    | with 50% in first (8 - delta_t) hours from burn timestamp.     |
|                                    |                                                                |
| CalculateBroselowDosingUseCase     | Maps color band to weight, ETT sizes (cuffed: Age/4 + 3.5),    |
|                                    | defibrillation joules (2 to 4 J/kg), and PALS drug volumes.    |
|                                    |                                                                |
| EvaluateAAPNomogramUseCase         | Continuous piecewise linear interpolation of TSB thresholds    |
|                                    | across Low, Medium, High risk tiers for phototherapy/exchange. |
|                                    |                                                                |
| CalculatePediatricScalingUseCase   | Evaluates Clark's, Young's, Fried's, and Haycock BSA rules     |
|                                    | with mandatory clamping at Adult Maximum Single Dose ceiling.  |
|                                    |                                                                |
| GenerateKhqrPaymentUseCase         | Constructs EMVCo-compliant KHQR payload with CRC-16 checksum,  |
|                                    | DeepLink intent dispatch, and Bakong transaction polling.      |
+------------------------------------+----------------------------------------------------------------+
```

---

## 7. Data Layer: Network, Storage, and Offline Mutation Engine

### 7.1 Retrofit Network Client with Security Interceptors
- Base URL dynamically points to hospital edge gateway or cloud NestJS instance.
- Automatic JWT Bearer token attachment on outbound requests.
- Automatic token refresh on HTTP 401 via `TokenAuthenticator` using encrypted refresh tokens.

```kotlin
@Singleton
class AuthInterceptor @Inject constructor(
    private val tokenStorage: EncryptedTokenStorage
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = tokenStorage.getAccessToken()

        val request = if (token != null) {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("X-Client-Platform", "Android-Native")
                .header("X-App-Version", BuildConfig.VERSION_NAME)
                .build()
        } else {
            original
        }
        return chain.proceed(request)
    }
}
```

### 7.2 Room Database and Offline Persistence
- Encrypted at rest via SQLCipher 256-bit AES encryption.
- Core Entities: `PatientEntity`, `TriageEntity`, `VitalSignsEntity`, `PrescriptionEntity`, `WardBedEntity`, `MutationQueueEntity`.

### 7.3 Offline Mutation Queue with WorkManager Background Sync
When network connectivity is disrupted in rural satellite clinics or shielded hospital wings, clinical actions (triage logs, bedside vitals, drug administrations) are committed immediately to the local Room database and appended to `mutation_queue`.

#### Mutation Queue Lifecycle:
1. `PENDING`: Stored locally with local UUID, entity payload (JSON), and timestamp.
2. `SYNCING`: WorkManager `SyncWorker` picks up pending records upon network availability (`NetworkType.CONNECTED`).
3. `SYNCED`: Successfully acknowledged by NestJS backend; local record updated with server timestamp.
4. `CONFLICT`: Server detects concurrent update; resolved via deterministic CRDT Vector Clock / LWW (Last-Write-Wins) rules.

```kotlin
@Entity(tableName = "mutation_queue")
data class MutationQueueEntity(
    @PrimaryKey val mutationId: String,
    val entityType: String, // TRIAGE, VITALS, DISPENSATION
    val actionType: String, // CREATE, UPDATE
    val payloadJson: String,
    val createdAtEpochMs: Long,
    val retryCount: Int = 0,
    val syncStatus: SyncStatus = SyncStatus.PENDING
)
```

---

## 8. Full Clinical Feature Specifications

### 8.1 Authentication and Biometric Session Management
- Multi-factor authentication: Doctor/Nurse credentials authenticate against NestJS `/api/auth/login`.
- JWT Token Storage: Access token (15-minute expiry) and Refresh token (7-day expiry) stored inside `EncryptedSharedPreferences` backed by Android Keystore hardware master keys.
- Biometric Re-authentication: App lock screen initiates `BiometricPrompt` (Class 3 Strong Biometrics: Fingerprint or Iris) on resume. Offline 6-digit cryptographic PIN fallback.

### 8.2 Clinical Triage and Vital Signs (ESI 1 to 5)
- Emergency Severity Index (ESI) Decision Tree:
  * ESI Level 1: Immediate life-saving intervention needed (cardiac arrest, severe respiratory distress, pulselessness). Triggers immediate resuscitation mode.
  * ESI Level 2: High risk, confused/lethargic, or severe pain/distress.
  * ESI Level 3: Stable, requires two or more hospital resources (labs, imaging, IV medications).
  * ESI Level 4: Stable, requires one resource (e.g., X-ray or simple sutures).
  * ESI Level 5: Stable, requires zero resources (e.g., prescription refill, bandage change).
- Shock Index calculation ($\text{HR} / \text{SBP}$) evaluated continuously. Alarm triggered if $\text{SI} > 0.9$.

### 8.3 Resuscitation and Emergency Engine
- Surviving Sepsis Campaign Hour-1 countdown timer with visual and auditory progress indicators.
- Parkland Burn Resuscitation calculator displaying Phase 1 (first 8 hours from injury) and Phase 2 hourly infusion rates.
- Broselow color zoning carousel with single-touch access to airway equipment and cardiac arrest medications.
- Massive Transfusion Protocol (MTP) activation workflow with 1:1:1 pack checklist and 1 g Calcium Chloride reminder every 4 units.

### 8.4 Pediatric and Neonatal Precision Pharmacotherapy
- Real-time calculator for Clark's Rule, Young's Rule, Fried's Rule, and Haycock BSA.
- Inviolable Adult Maximum Single Dose Cap: UI displays prominent clamping notification whenever pediatric calculation exceeds adult ceiling.
- AAP 2022 Hyperbilirubinemia interactive nomogram: plots patient's TSB on dynamic hour-of-life curve, displaying distance to phototherapy and exchange transfusion lines.

### 8.5 Patient Outpatient Queue and Inpatient Bed Ward Tracker
- Real-time OPD queue board displaying waiting, in-consultation, and completed status with Khmer audio callout integration.
- IPD bed ward grid displaying room numbers, bed occupancy, patient acuity, attending physician, and isolation precautions (Airborne, Droplet, Contact).

### 8.6 Pharmacy Dispensation and Point of Sale (KHQR)
- Barcode/QR scanner using Google ML Kit Barcode Scanning API for instant medication package verification and batch expiry checks.
- Narcotic & Controlled Substances double-signoff: requiring secondary nurse biometric confirmation before dispensation.
- KHQR Payment Engine:
  * Generates standard Bakong EMVCo Static or Dynamic QR code.
  * Triggers Native Android DeepLink intent (`bakong://` or individual bank deep links: ABA Mobile, Acleda, Canadia) for seamless point-of-sale settlement.
  * Automated payment status polling against NestJS PayWay gateway.

### 8.7 Teleconsultation and Mobile PACS DICOM Viewer
- WebRTC Audio/Video consultation: High-definition peer-to-peer clinical calling with picture-in-picture (PiP) support.
- Native DICOM Slice Viewer:
  * Directly parses DICOM Part 10 binary files downloaded from hospital dcm4chee / Orthanc PACS archive.
  * Native rendering via OpenGL ES 3.0 / Canvas with hardware-accelerated Window Width / Window Level (WW/WL) sliders for soft tissue, bone, and lung window presets.
  * Calibrated linear distance caliper measurement in millimeters based on DICOM `PixelSpacing` tag `(0028,0030)`.

---

## 9. Security, Cryptography, and Network Configuration

### 9.1 Network Security Configuration
Android 9.0 (API 28) and above blocks cleartext HTTP by default. To support local edge clinic nodes (`192.168.*.*`) and Android Emulator development while enforcing strict HTTPS for production cloud endpoints, the project incorporates a dedicated `network_security_config.xml`.

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- d:\WEB Development\clinic-patient-management\mobile\app\src\main\res\xml\network_security_config.xml -->
<network-security-config>
    <!-- Base Configuration: Enforce strict TLS 1.3/1.2 for all public domains -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <!-- Cleartext overrides restricted strictly to local emulator and internal clinic LAN -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">192.168.100.1</domain>
    </domain-config>
</network-security-config>
```

### 9.2 Cryptographic Keystore Isolation
- Encryption Algorithm: AES-256-GCM authenticated encryption.
- Key Generation: Hardware-backed Android Keystore (`AndroidKeyStore` provider) with `KeyGenParameterSpec.Builder(PURPOSE_ENCRYPT or PURPOSE_DECRYPT)`.
- In-memory clinical data protection: Sensitive patient health information (PHI) is purged from RAM on app backgrounding via `onTrimMemory(TRIM_MEMORY_UI_HIDDEN)`.

---

## 10. Google Play Store Readiness & Build Engineering

### 10.1 Android App Bundle (AAB) Architecture
The production deliverable is configured as an Android App Bundle (`.aab`) rather than a monolithic APK. Google Play Dynamic Delivery splits resources by:
- Screen Density (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi).
- CPU Architecture (arm64-v8a, armeabi-v7a, x86_64).
- Language Packs (English, Khmer).

### 10.2 ProGuard and R8 Optimization Rules
Comprehensive obfuscation, dead code stripping, and reflection preservation:

```proguard
# R8 ProGuard Configuration for KruPet Clinical Mobile
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Retrofit 2 and OkHttp
-keepclassmembers,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
-dontwarn okhttp3.**
-dontwarn retrofit2.**

# Room Database
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Kotlinx Serialization
-keepattributes *Annotation*,InnerClasses
-dontnote kotlinx.serialization.**
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer();
}

# Medical Domain Models - Preserve clinical data integrity
-keep class com.krupet.clinic.core.model.** { *; }
```

---

## 11. Bilingual Khmer and English Clinical UI Localization Reference

The user interface supports instantaneous language switching between English and Khmer.

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Clinical UI Identifier       | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| KruPet Clinical Mobile               | ប្រព័ន្ធគ្រប់គ្រងគ្លីនិកចល័ត គ្រូពេទ្យ                        |
| Emergency Triage System              | ប្រព័ន្ធវាយតម្លៃនិងតម្រៀបកម្រិតសង្គ្រោះបន្ទាន់              |
| Emergency Severity Index - ESI 1-5   | សន្ទស្សន៍ភាពធ្ងន់ធ្ងរនៃជំងឺកម្រិត ១ ដល់កម្រិត ៥              |
| Shock Index Monitoring               | សន្ទស្សន៍តាមដានស្ថានភាពតក់ស្លុត                              |
| Sepsis Hour-1 Bundle Timer           | នាឡិការាប់ថយក្រោយកញ្ចប់សង្គ្រោះជំងឺឆ្លងធ្ងន់ក្នុងម៉ោងទី ១    |
| Parkland Burn Fluid Calculator       | ឧបករណ៍គណនាសេរ៉ូមអ្នករលាកភ្លើងរូបមន្តផាកឡិន                |
| Broselow Pediatric Tape              | បន្ទះពណ៌ប្រូស្លូវសម្រាប់សង្គ្រោះបន្ទាន់កុមារ                 |
| Pediatric Precision Dosing           | ការគណនាកម្រិតថ្នាំកុមារនិងទារកច្បាស់លាស់                     |
| Adult Max Single Dose Cap Clamped    | កម្រិតថ្នាំត្រូវបានកម្រិតត្រឹមកម្រិតអតិបរមាមនុស្សពេញវ័យ       |
| AAP Hyperbilirubinemia Nomogram      | ក្រាហ្វវាស់កម្រិតលឿងទារកតាមគោលការណ៍ AAP                      |
| Outpatient Department - OPD Queue    | បញ្ជីរង់ចាំពិនិត្យជំងឺក្រៅ                                   |
| Inpatient Department - IPD Ward Map  | ប្លង់គ្រប់គ្រងគ្រែអ្នកជំងឺសម្រាកព្យាបាល                     |
| Bed Occupancy Status                 | ស្ថានភាពនៃការប្រើប្រាស់គ្រែពេទ្យ                             |
| Pharmacy Dispensation Station        | ផ្នែកចែកថ្នាំនិងឱសថស្ថានគ្លីនិក                              |
| Bakong KHQR DeepLink Payment         | ការទូទាត់ប្រាក់តាមប្រព័ន្ធបាគង KHQR ឌីបលីង                   |
| Narcotic Register Dual Signoff       | ការចុះហត្ថលេខាបញ្ជាក់ទ្វេភាគីលើបញ្ជីថ្នាំញៀន                |
| Teleconsultation Audio Video         | ការពិគ្រោះជំងឺពីចម្ងាយតាមប្រព័ន្ធវីដេអូនិងសំឡេង              |
| PACS DICOM Image Viewer              | ឧបករណ៍ពិនិត្យរូបភាពវេជ្ជសាស្ត្រ DICOM ពីប្រព័ន្ធ PACS        |
| Offline Mutation Queue Synchronizing | កំពុងដំណើរការធ្វើសមកាលកម្មទិន្នន័យក្រៅបណ្តាញ                 |
| Biometric Fingerprint Unlock         | ការដោះសោសុវត្ថិភាពដោយប្រើស្នាមម្រាមដៃ                       |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 12. Verification Checklist and Safety Interlocks

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Drive C Storage Protection             | Host Safety Lock    | All SDK paths, Gradle caches, and build outputs are     |
|                                        |                     | strictly routed to Drive D (d:\Android\Sdk, D:\.gradle).|
|                                        |                     |                                                         |
| Cleartext Network Security Lock        | Network Boundary    | Cleartext traffic is strictly blocked on all public IPs;|
|                                        |                     | permitted solely for 10.0.2.2 and local hospital LAN.   |
|                                        |                     |                                                         |
| Inviolable Adult Maximum Dose Cap      | Clinical Guard      | Automatic clamping prevents pediatric overdosing when   |
|                                        |                     | mg/kg or BSA scaling yields doses above adult limits.   |
|                                        |                     |                                                         |
| Biometric Re-Authentication Timeout    | Security Guard      | Mandates biometric fingerprint or PIN challenge after   |
|                                        |                     | 5 minutes of app backgrounding.                         |
|                                        |                     |                                                         |
| Narcotic Two-Person Rule Check         | Regulatory Interlock| Enforces second clinical nurse biometric witness scan   |
|                                        |                     | before controlled substance dispensation record commits.|
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
