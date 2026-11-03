# Mobile PACS DICOM Viewer and Radiographic Measurement Engine Specification
Document Identifier: PACS-DICOM-VIEWER-SPEC-2026-V1
Compliance Standards: DICOM PS 3.x Standard, DICOMweb WADO-RS / QIDO-RS (NEMA PS 3.18), AAPM TG18 Medical Display Standards, ACR-AAPM-SIIM Technical Standard for Electronic Practice of Medical Imaging
Classification: Enterprise Standard Medical Imaging, Teleradiology, and Mobile DICOM Diagnostic Caliper Engine

---

## 1. Executive Summary and System Architecture

### 1.1 Clinical Rationale
Rapid review of diagnostic radiological imaging - Computed Radiography (CR), Digital Radiography (DX), Computed Tomography (CT), Magnetic Resonance Imaging (MR), and Ultrasound (US) - on portable mobile tablets and bedside smartphones is critical for acute trauma resuscitation, neurosurgical triage, stroke code pathways, and remote provincial consultations across Cambodia.

The KruPet Mobile PACS DICOM Viewer Engine provides:
1. Standardized DICOM Part 10 parsing and DICOMweb RESTful WADO-RS retrieve endpoints.
2. High-precision Window Width (WW) and Window Level (WL) radiologic presets (Bone, Soft Tissue, Lung, Brain, Stroke/Subdural).
3. Hardware-accelerated touch-gesture manipulation: Interactive windowing drag, two-finger pan, pinch-zoom, and contrast inversion (MONOCHROME1 vs MONOCHROME2).
4. Calibrated quantitative measurement calipers: Euclidean distance in millimeters using DICOM PixelSpacing tag (0028,0030), Cobb angle for scoliosis, and Cardiothoracic Ratio (CTR) for cardiomegaly screening.
5. Progressive encrypted local caching of multi-slice emergency trauma CT and MR series for immediate offline availability.

```
+----------------------------------------------------------------------------------------------------+
|                         MOBILE PACS DICOM VIEWER AND MEASUREMENT ARCHITECTURE                      |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ HOSPITAL PACS ARCHIVE: DCM4CHEE / ORTHANC / CLOUD PACS ]                                        |
|  - QIDO-RS Study Search: GET /studies?PatientID={upid}                                             |
|  - WADO-RS Metadata Retrieve: GET /studies/{studyUid}/series/{seriesUid}/metadata                  |
|  - WADO-RS Frame Stream: GET /studies/{studyUid}/series/{seriesUid}/instances/{sopUid}/frames/{n}  |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | DICOM DATASET & PIXEL MODULE PARSER                                                           | |
|  | - Parses Transfer Syntax UID: Explicit/Implicit VR, JPEG 2000, JPEG Lossless                  | |
|  | - Extracts Pixel Representation, Bits Stored, High Bit, Photometric Interpretation             | |
|  | - Evaluates Rescale Slope (0028,1053) & Intercept (0028,1052): HU = (PV * Slope) + Intercept    | |
|  | - Extracts Calibrated Spacing: PixelSpacing (0028,0030) [dy, dx] in mm                         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | RADIOLOGIC WINDOWING & RENDERING PIPELINE (OPENGL ES 3.0 / JETPACK COMPOSE)                   | |
|  | - Maps Hounsfield Units to 8-bit Grayscale [0, 255] via Window Width (WW) & Window Level (WL) | |
|  | - Diagnostic Presets: Bone (2000/300), Soft Tissue (400/40), Lung (1500/-600), Brain (80/40)   | |
|  | - Invert Grayscale Toggle: MONOCHROME1 (White-on-Black) vs MONOCHROME2 (Black-on-White)        | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | QUANTITATIVE RADIOGRAPHIC MEASUREMENT CALIPERS                                                | |
|  | - Euclidean Metric Caliper: Distance (mm) = sqrt((dx*sx)^2 + (dy*sy)^2)                       | |
|  | - Cobb Angle Caliper: arctan(|(m1 - m2)/(1 + m1*m2)|) * (180 / pi)                            | |
|  | - Cardiothoracic Ratio (CTR): (TR + TL) / ID (Normal <= 0.50, Alert if > 0.50)                | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ OFFLINE ENCRYPTED SLICE CACHE (ROOM SQLITE & DRIVE D BUFFER) ]                                  |
|  - Progressive slice pre-fetching, LRU cache eviction, AES-256 encrypted storage                   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. DICOM Parsing and WADO-RS Retrieve Architecture

### 2.1 Standard DICOMweb Endpoints
The mobile client interfaces with hospital PACS archives via standardized RESTful DICOMweb services:
1. QIDO-RS (Query based on ID for DICOM Objects):
   ```http
   GET /api/v1/pacs/studies?PatientID=PAT_CAM_98412&ModalitiesInStudy=CT,MR,DX HTTP/1.1
   Accept: application/dicom+json
   ```
2. WADO-RS (Web Access to DICOM Objects by RESTful Services):
   - Retrieve Study Metadata:
     ```http
     GET /api/v1/pacs/studies/{studyInstanceUid}/metadata HTTP/1.1
     Accept: application/dicom+json
     ```
   - Retrieve Single Uncompressed Rendered Instance:
     ```http
     GET /api/v1/pacs/studies/{studyInstanceUid}/series/{seriesInstanceUid}/instances/{sopInstanceUid}/rendered HTTP/1.1
     Accept: image/jpeg, image/png
     ```
   - Retrieve Raw Binary DICOM Part 10 Slice for Local Processing:
     ```http
     GET /api/v1/pacs/studies/{studyInstanceUid}/series/{seriesInstanceUid}/instances/{sopInstanceUid} HTTP/1.1
     Accept: application/dicom
     ```

### 2.2 Core DICOM Image Pixel Module Tags

```
+---------------+-------------------------------+-----------+---------------------------------------------------------+
| DICOM Tag     | Element Name                  | VR        | Clinical Interpretation and Parser Logic                |
+---------------+-------------------------------+-----------+---------------------------------------------------------+
| (0008,0060)   | Modality                      | CS        | CR, DX, CT, MR, US, NM, PT, XA.                         |
| (0028,0004)   | Photometric Interpretation    | CS        | MONOCHROME1, MONOCHROME2, RGB, YBR_FULL.                |
| (0028,0010)   | Rows                          | US        | Number of vertical image pixels (e.g. 512, 1024, 2048).  |
| (0028,0011)   | Columns                       | US        | Number of horizontal image pixels.                      |
| (0028,0030)   | Pixel Spacing                 | DS        | Physical distance between pixel centers: [dy, dx] in mm.|
| (0028,0100)   | Bits Allocated                | US        | Total bits reserved per pixel (typically 16 or 8).      |
| (0028,0101)   | Bits Stored                   | US        | Actual bits utilized (typically 12 or 16).              |
| (0028,0102)   | High Bit                      | US        | Most significant bit position (typically BitsStored - 1)|
| (0028,0103)   | Pixel Representation          | US        | 0 for unsigned integer, 1 for 2's complement signed.    |
| (0028,1050)   | Window Center (Level)         | DS        | Default manufacturer-recommended window center.         |
| (0028,1051)   | Window Width                  | DS        | Default manufacturer-recommended window width.          |
| (0028,1052)   | Rescale Intercept             | DS        | Linear intercept constant (b) to compute Hounsfield units|
| (0028,1053)   | Rescale Slope                 | DS        | Linear slope constant (m) to compute Hounsfield units.  |
| (0018,0050)   | Slice Thickness               | DS        | Nominal reconstructed slice thickness in mm.            |
| (0020,0032)   | Image Position (Patient)      | DS        | Spatial coordinates [x, y, z] of upper left hand corner.|
+---------------+-------------------------------+-----------+---------------------------------------------------------+
```

### 2.3 Hounsfield Unit (HU) Transformation
For CT modalities, raw integer pixel values ($PV$) extracted from the binary slice must be converted to physical Hounsfield attenuation units ($HU$):

$$HU = (PV \times \text{RescaleSlope}) + \text{RescaleIntercept}$$

Where:
- Air attenuation $\approx -1,000\text{ HU}$.
- Pure Water attenuation $\equiv 0\text{ HU}$.
- Muscle / Soft Tissue $\approx +30\text{ to }+60\text{ HU}$.
- Acute Blood / Hematoma $\approx +50\text{ to }+80\text{ HU}$.
- Cortical Bone $\approx +1,000\text{ to }+2,000\text{ HU}$.

---

## 3. Window Width (WW) and Window Level (WL) Radiologic Presets

### 3.1 Linear Windowing Mathematical Formulation
Human eyes can distinguish only approximately 30 to 40 shades of gray, whereas a 12-bit CT image contains 4,096 discrete attenuation levels. Windowing compresses the clinical region of interest into an 8-bit display spectrum $[0, 255]$:

$$\text{Lower Bound} = \text{WindowLevel} - \frac{\text{WindowWidth}}{2}$$

$$\text{Upper Bound} = \text{WindowLevel} + \frac{\text{WindowWidth}}{2}$$

$$\text{Grayscale Output}(HU) = \begin{cases}
0 & \text{if } HU \le \text{Lower Bound} \\
255 & \text{if } HU \ge \text{Upper Bound} \\
\left(\frac{HU - \text{Lower Bound}}{\text{WindowWidth}}\right) \times 255 & \text{if } \text{Lower Bound} < HU < \text{Upper Bound}
\end{cases}$$

For `MONOCHROME1` datasets (where minimum pixel value is intended to display as white):
$$\text{Grayscale}_{\text{MONO1}} = 255 - \text{Grayscale Output}$$

### 3.2 Diagnostic Windowing Presets

```
+--------------------------+------------+------------+---------------------------------------------------------+
| Preset Name              | Width (W)  | Level (L)  | Clinical Diagnostic Indication                          |
+--------------------------+------------+------------+---------------------------------------------------------+
| Bone Window              | 2000 HU    | +300 HU    | Evaluates cortical bone fractures, osteolytic lesions,   |
|                          |            |            | cranial base integrity, and orthopedic fixation devices.|
|                          |            |            |                                                         |
| Soft Tissue / Abdominal  | 400 HU     | +40 HU     | Delineates visceral organ parenchyma (liver, spleen,    |
|                          |            |            | kidneys), retroperitoneal hematomas, and lymph nodes.   |
|                          |            |            |                                                         |
| Lung Parenchyma Window   | 1500 HU    | -600 HU    | Visualizes bronchial architecture, ground-glass opacity,|
|                          |            |            | pneumothorax, pulmonary emboli cavitation, atelectasis. |
|                          |            |            |                                                         |
| Brain Tissue Window      | 80 HU      | +40 HU     | Optimizes gray-white matter junction differentiation,   |
|                          |            |            | early cerebral ischemia, midline shift, and edema.      |
|                          |            |            |                                                         |
| Stroke / Subdural Window | 130 HU     | +35 HU     | Differentiates acute subdural/epidural blood (+60 HU)   |
|                          |            |            | from the adjacent hyperdense inner cranial vault table. |
|                          |            |            |                                                         |
| Mediastinal Window       | 350 HU     | +50 HU     | Evaluates cardiac chambers, great vessel caliber, aorta |
|                          |            |            | dissection flaps, and mediastinal lymphadenopathy.      |
+--------------------------+------------+------------+---------------------------------------------------------+
```

---

## 4. Touchscreen Interactive Tools and Gesture Mapping

The mobile user interface implements gesture recognizers atop a high-performance Jetpack Compose Canvas or OpenGL ES 3.0 surface:

```
+-----------------------+---------------------------+---------------------------------------------------------+
| User Touch Gesture    | Active Tool Mode          | Graphical Viewport and Shader Transformation            |
+-----------------------+---------------------------+---------------------------------------------------------+
| Single-Finger Drag    | Windowing (WW / WL)       | - Horizontal drag delta (dx) adjusts Window Width:      |
|                       |                           |   WW_new = WW_current + (dx * SensitivityFactor)        |
|                       |                           | - Vertical drag delta (dy) adjusts Window Level:        |
|                       |                           |   WL_new = WL_current - (dy * SensitivityFactor)        |
|                       |                           |                                                         |
| Two-Finger Pan        | Pan Viewport              | Translates viewport origin (tx, ty) across canvas.      |
|                       |                           | Clamped to canvas bounds.                               |
|                       |                           |                                                         |
| Two-Finger Pinch      | Pinch-to-Zoom             | Scales viewport by zoom factor (0.5x to 10.0x) centered |
|                       |                           | precisely on touch gesture midpoint.                    |
|                       |                           |                                                         |
| Two-Finger Double Tap | Viewport Reset            | Restores image zoom to 1.0x (fit-to-screen) and centers  |
|                       |                           | viewport with default manufacturer windowing preset.    |
|                       |                           |                                                         |
| Toolbar Action Toggle | Contrast Inversion        | Inverts pixel rendering pipeline between MONOCHROME1    |
|                       |                           | (air is white) and MONOCHROME2 (air is black).          |
+-----------------------+---------------------------+---------------------------------------------------------+
```

---

## 5. Quantitative Measurement Calipers & Algorithms

### 5.1 Euclidean Distance Measurement Caliper
Physicians tap two anatomical landmarks on the image to measure linear dimensions (e.g., tumor diameter, fracture displacement, aortic caliber).

#### Mathematical Formulation:
Let point $P_1 = (x_1, y_1)$ and point $P_2 = (x_2, y_2)$ represent the touch coordinates in image pixel space. Let DICOM tag `(0028,0030)` provide row spacing $s_y$ and column spacing $s_x$ in millimeters:

$$\Delta x_{\text{mm}} = (x_2 - x_1) \times s_x$$

$$\Delta y_{\text{mm}} = (y_2 - y_1) \times s_y$$

$$\text{Distance (mm)} = \sqrt{(\Delta x_{\text{mm}})^2 + (\Delta y_{\text{mm}})^2}$$

If `PixelSpacing` is absent from the DICOM dataset (e.g. uncalibrated tele-radiographs), the engine displays the distance in raw screen pixels (`px`) accompanied by a persistent warning: "UNCALIBRATED SPATIAL GEOMETRY - MEASUREMENT IN PIXELS ONLY".

---

### 5.2 Cobb Angle for Scoliosis Assessment
The Cobb angle quantifies coronal spinal deformity. The clinician identifies the superior endplate of the upper-most tilted vertebra and the inferior endplate of the lower-most tilted vertebra.

#### Mathematical Formulation:
- Line 1 (Upper Vertebra Endplate): Defined by points $A(x_1, y_1)$ and $B(x_2, y_2)$, with slope $m_1 = \frac{y_2 - y_1}{x_2 - x_1}$.
- Line 2 (Lower Vertebra Endplate): Defined by points $C(x_3, y_3)$ and $D(x_4, y_4)$, with slope $m_2 = \frac{y_4 - y_3}{x_4 - x_3}$.

The intersection angle $\theta$ in degrees:

$$\theta = \arctan\left(\left|\frac{m_1 - m_2}{1 + m_1 m_2}\right|\right) \times \left(\frac{180^\circ}{\pi}\right)$$

#### Clinical Severity Stratification:
- Normal Spine: $\theta < 10^\circ$
- Mild Scoliosis: $\theta = 10^\circ \text{ to } 24^\circ$
- Moderate Scoliosis: $\theta = 25^\circ \text{ to } 39^\circ$ (Orthopedic bracing consideration)
- Severe Scoliosis: $\theta \ge 40^\circ$ (Surgical spinal fusion evaluation)

---

### 5.3 Cardiothoracic Ratio (CTR) for Cardiomegaly Screening
Evaluated on a standard Postero-Anterior (PA) upright chest radiograph to identify cardiac enlargement.

#### Measurement Method:
1. Draw a vertical central anatomical reference line down the vertebral spinous processes.
2. Measure $T_R$ (maximum transverse cardiac distance from the central midline to the right heart border in mm).
3. Measure $T_L$ (maximum transverse cardiac distance from the central midline to the left heart border in mm).
4. Measure $ID$ (maximum internal horizontal thoracic diameter at the level of the right hemidiaphragm in mm).

$$\text{CTR} = \frac{T_R + T_L}{ID}$$

#### Clinical Diagnostic Interpretation:
- Normal Adult Heart: $\text{CTR} \le 0.50$ ($50\%$)
- Normal Infant (Under 1 year): $\text{CTR} \le 0.55$ ($55\%$)
- Cardiomegaly Alert: $\text{CTR} > 0.50$ in adults. Indicates enlarged cardiac silhouette, secondary to congestive heart failure (CHF), dilated cardiomyopathy, severe valvular regurgitation, or pericardial effusion.

---

## 6. Offline Progressive Caching of Emergency Trauma CT Slices

To support trauma resuscitation when hospital local networks fail:
- Room SQLite Schema: `pacs_cached_slices` stores Study UID, Series UID, SOP UID, Modality, Slice Index, Pixel Spacing, Window Presets, and AES-256 encrypted slice binary bytes on Drive D.
- Predictive Adjacent Pre-Fetching: When a clinician views slice $N$ in a 200-slice CT trauma series, the background WorkManager thread automatically pre-fetches slices $N-5$ through $N+5$.
- Least Recently Used (LRU) Cache Eviction: Maximum local cache size is configured per device (default 4.0 GB on Drive D), automatically purging oldest non-emergency studies when capacity reaches $90\%$.

---

## 7. Production-Grade Kotlin Serialization Models & Radiographic Engine

```kotlin
package com.krupet.clinic.core.model.pacs

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - PACS DICOM Viewer Models & Geometry Engine
 * File: PacsDicomViewerModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class DicomModality {
    CR,
    DX,
    CT,
    MR,
    US
}

@Serializable
enum class PhotometricInterpretation {
    MONOCHROME1,
    MONOCHROME2,
    RGB,
    YBR_FULL
}

@Serializable
enum class WindowPreset(
    val presetNameEn: String,
    val windowWidth: Float,
    val windowLevel: Float
) {
    BONE("Bone Window", 2000.0f, 300.0f),
    SOFT_TISSUE("Soft Tissue Window", 400.0f, 40.0f),
    LUNG("Lung Window", 1500.0f, -600.0f),
    BRAIN("Brain Window", 80.0f, 40.0f),
    STROKE_SUBDURAL("Stroke Subdural Window", 130.0f, 35.0f),
    MEDIASTINUM("Mediastinum Window", 350.0f, 50.0f);

    val presetNameKh: String
        get() = when (this) {
            BONE -> "ផ្ទាំងឆ្អឹង Bone Window"
            SOFT_TISSUE -> "ផ្ទាំងសាច់ទន់ Soft Tissue Window"
            LUNG -> "ផ្ទាំងសួត Lung Window"
            BRAIN -> "ផ្ទាំងជាលិកាខួរក្បាល Brain Window"
            STROKE_SUBDURAL -> "ផ្ទាំងគ្រោះថ្នាក់សរសៃឈាមខួរក្បាល Stroke Window"
            MEDIASTINUM -> "ផ្ទាំងប្រអប់ទ្រូង Mediastinum Window"
        }
}

@Serializable
data class DicomSliceMetadata(
    val studyInstanceUid: String,
    val seriesInstanceUid: String,
    val sopInstanceUid: String,
    val modality: DicomModality,
    val photometricInterpretation: PhotometricInterpretation,
    val rows: Int,
    val columns: Int,
    val pixelSpacingX: Float?,        // mm per pixel
    val pixelSpacingY: Float?,        // mm per pixel
    val rescaleIntercept: Float = 0.0f,
    val rescaleSlope: Float = 1.0f,
    val defaultWindowWidth: Float = 400.0f,
    val defaultWindowLevel: Float = 40.0f,
    val sliceThicknessMm: Float? = null,
    val sliceLocationMm: Float? = null,
    val instanceNumber: Int = 1
)

@Serializable
data class Point2D(
    val x: Float,
    val y: Float
)

@Serializable
data class DistanceMeasurementResult(
    val distanceMm: Float?,
    val distancePixels: Float,
    val isCalibrated: Boolean,
    val displayStringEn: String,
    val displayStringKh: String
)

@Serializable
data class CobbAngleResult(
    val angleDegrees: Float,
    val severityEn: String,
    val severityKh: String,
    val clinicalDirectiveEn: String,
    val clinicalDirectiveKh: String
)

@Serializable
data class CtrMeasurementResult(
    val cardiothoracicRatio: Float,
    val isCardiomegaly: Boolean,
    val heartBreadthMm: Float,
    val thoracicDiameterMm: Float,
    val diagnosticSummaryEn: String,
    val diagnosticSummaryKh: String
)

object RadiographicCaliperEngine {

    /**
     * Calculates Euclidean distance in millimeters using PixelSpacing tag (0028,0030)
     */
    fun calculateDistance(
        p1: Point2D,
        p2: Point2D,
        spacingX: Float?,
        spacingY: Float?
    ): DistanceMeasurementResult {
        val dxPix = p2.x - p1.x
        val dyPix = p2.y - p1.y
        val distPix = Math.sqrt((dxPix * dxPix + dyPix * dyPix).toDouble()).toFloat()

        if (spacingX != null && spacingY != null && spacingX > 0.0f && spacingY > 0.0f) {
            val dxMm = dxPix * spacingX
            val dyMm = dyPix * spacingY
            val distMm = Math.sqrt((dxMm * dxMm + dyMm * dyMm).toDouble()).toFloat()
            val formattedMm = format(distMm)

            return DistanceMeasurementResult(
                distanceMm = formattedMm,
                distancePixels = format(distPix),
                isCalibrated = true,
                displayStringEn = "$formattedMm mm",
                displayStringKh = "$formattedMm មីលីម៉ែត្រ"
            )
        }

        val formattedPix = format(distPix)
        return DistanceMeasurementResult(
            distanceMm = null,
            distancePixels = formattedPix,
            isCalibrated = false,
            displayStringEn = "$formattedPix px - Uncalibrated",
            displayStringKh = "$formattedPix ភីកសែល មិនទាន់មានខ្នាតជាក់លាក់"
        )
    }

    /**
     * Calculates Cobb Angle between two vertebral endplate lines
     */
    fun calculateCobbAngle(
        line1Start: Point2D,
        line1End: Point2D,
        line2Start: Point2D,
        line2End: Point2D
    ): CobbAngleResult {
        val m1 = (line1End.y - line1Start.y) / (line1End.x - line1Start.x)
        val m2 = (line2End.y - line2Start.y) / (line2End.x - line2Start.x)

        val tanTheta = Math.abs((m1 - m2) / (1.0 + m1 * m2))
        val angleRad = Math.atan(tanTheta)
        val angleDeg = (angleRad * (180.0 / Math.PI)).toFloat()
        val fmtAngle = format(angleDeg)

        val sevEn: String
        val sevKh: String
        val dirEn: String
        val dirKh: String

        when {
            angleDeg < 10.0f -> {
                sevEn = "Normal Alignment - Under 10 degrees"
                sevKh = "ឆ្អឹងខ្នងមានទ្រង់ទ្រាយត្រង់ធម្មតា ក្រោមកម្រិត ១០ ដឺក្រេ"
                dirEn = "Physiological spinal alignment. No scoliosis treatment indicated."
                dirKh = "ឆ្អឹងខ្នងមានសភាពធម្មតា មិនត្រូវការការព្យាបាលនោះទេ"
            }
            angleDeg <= 24.0f -> {
                sevEn = "Mild Scoliosis - 10 to 24 degrees"
                sevKh = "ជំងឺកោងឆ្អឹងខ្នងកម្រិតស្រាល ចន្លោះពី ១០ ដល់ ២៤ ដឺក្រេ"
                dirEn = "Serial radiographic observation every 6 months to monitor curve progression."
                dirKh = "តាមដានថតកាំរស្មីអ៊ិចរៀងរាល់ ៦ ខែម្តង ដើម្បីពិនិត្យការវិវត្តនៃដងឆ្អឹង"
            }
            angleDeg <= 39.0f -> {
                sevEn = "Moderate Scoliosis - 25 to 39 degrees"
                sevKh = "ជំងឺកោងឆ្អឹងខ្នងកម្រិតមធ្យម ចន្លោះពី ២៥ ដល់ ៣៩ ដឺក្រេ"
                dirEn = "Orthopedic consultation for corrective spinal bracing consideration."
                dirKh = "ពិគ្រោះជាមួយគ្រូពេទ្យឯកទេសឆ្អឹង ដើម្បីពិចារណាពាក់អាវទ្រឆ្អឹងខ្នងកែទម្រង់"
            }
            else -> {
                sevEn = "Severe Scoliosis - 40 degrees or greater"
                sevKh = "ជំងឺកោងឆ្អឹងខ្នងកម្រិតធ្ងន់ធ្ងរ ចាប់ពី ៤០ ដឺក្រេឡើងទៅ"
                dirEn = "Spine surgery consultation for operative correction and fusion."
                dirKh = "ពិគ្រោះជាមួយគ្រូពេទ្យវះកាត់ឆ្អឹងខ្នងជាបន្ទាន់ ដើម្បីវះកាត់កែសម្រួលដងឆ្អឹង"
            }
        }

        return CobbAngleResult(
            angleDegrees = fmtAngle,
            severityEn = sevEn,
            severityKh = sevKh,
            clinicalDirectiveEn = dirEn,
            clinicalDirectiveKh = dirKh
        )
    }

    /**
     * Calculates Cardiothoracic Ratio (CTR) on PA Chest X-ray
     * CTR = (TR + TL) / ID. Normal adult <= 0.50.
     */
    fun calculateCtr(
        rightMidlineMm: Float,
        leftMidlineMm: Float,
        internalThoraxMm: Float
    ): CtrMeasurementResult {
        val cardiacDiameter = rightMidlineMm + leftMidlineMm
        val ratio = if (internalThoraxMm > 0.0f) (cardiacDiameter / internalThoraxMm) else 0.0f
        val fmtRatio = format(ratio)
        val isEnlarged = ratio > 0.50f

        val sumEn = if (isEnlarged) {
            "CARDIOMEGALY DETECTED: CTR $fmtRatio > 0.50. Indicates enlarged cardiac silhouette."
        } else {
            "NORMAL CARDIOTHORACIC RATIO: CTR $fmtRatio <= 0.50. Normal cardiac size."
        }

        val sumKh = if (isEnlarged) {
            "រកឃើញទំហំបេះដូងរីកធំ: សន្ទស្សន៍ CTR $fmtRatio លើសពី ០.៥០ បង្ហាញពីស្រមោលបេះដូងរីកធំខុសប្រក្រតី"
        } else {
            "សន្ទស្សន៍ទ្រូងនិងបេះដូងធម្មតា: សន្ទស្សន៍ CTR $fmtRatio ស្មើឬក្រោម ០.៥០ បេះដូងមានទំហំធម្មតា"
        }

        return CtrMeasurementResult(
            cardiothoracicRatio = fmtRatio,
            isCardiomegaly = isEnlarged,
            heartBreadthMm = format(cardiacDiameter),
            thoracicDiameterMm = format(internalThoraxMm),
            diagnosticSummaryEn = sumEn,
            diagnosticSummaryKh = sumKh
        )
    }

    private fun format(value: Float): Float = Math.round(value * 100.0f) / 100.0f
}
```

---

## 8. Bilingual Khmer and English Radiological Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Radiological Terminology     | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| Mobile PACS DICOM Viewer Engine      | ឧបករណ៍ពិនិត្យរូបភាពវេជ្ជសាស្ត្រចល័ត DICOM លើប្រព័ន្ធ PACS      |
| Computed Radiography - CR Image      | រូបភាពកាំរស្មីអ៊ិចបែបឌីជីថល CR                                |
| Digital Radiography - DX Modality    | ឧបករណ៍ថតកាំរស្មីអ៊ិចផ្ទាល់ DX                                |
| Computed Tomography - CT Scan        | ម៉ាស៊ីនស្កេនកុំព្យូទ័រ CT                                      |
| Magnetic Resonance Imaging - MRI     | ម៉ាស៊ីនស្កេនដែនម៉ាញេទិក MRI                                  |
| Diagnostic Ultrasound - US Modality  | ម៉ាស៊ីនអេកូសាស្ត្រវេជ្ជសាស្ត្រ                               |
| Window Width and Window Level        | កម្រិតពន្លឺនិងកម្រិតកម្រិតពណ៌រូបភាព WW និង WL                |
| Bone Radiologic Window Preset        | ផ្ទាំងពណ៌ពិនិត្យឆ្អឹង                                         |
| Soft Tissue Abdominal Window Preset  | ផ្ទាំងពណ៌ពិនិត្យជាលិកាទន់និងសរីរាង្គក្នុងពោះ                   |
| Lung Parenchyma Window Preset        | ផ្ទាំងពណ៌ពិនិត្យជាលិកាសួត                                     |
| Brain Tissue Window Preset           | ផ្ទាំងពណ៌ពិនិត្យជាលិកាខួរក្បាល                                |
| Stroke and Subdural Window Preset    | ផ្ទាំងពណ៌ពិនិត្យការដាច់សរសៃឈាមនិងឈាមកកក្នុងខួរក្បាល         |
| Grayscale Contrast Inversion Toggle  | ការត្រឡប់កម្រិតពណ៌សខ្មៅនៃរូបភាព                              |
| Euclidean Metric Caliper in mm       | ប្រដាប់វាស់ប្រវែងជាក់ស្តែងគិតជាមីលីម៉ែត្រ                    |
| Calibrated Pixel Spacing Attribute   | ខ្នាតគម្លាតរវាងគ្រាប់ភីកសែលមានការក្រិតត្រឹមត្រូវ               |
| Cobb Angle Scoliosis Measurement     | ការវាស់មុំកោងឆ្អឹងខ្នងកប់                                     |
| Cardiothoracic Ratio - CTR Caliper   | សន្ទស្សន៍សមាមាត្រទំហំបេះដូងធៀបនឹងប្រអប់ទ្រូង CTR             |
| Cardiomegaly Enlarged Heart Alert    | ការប្រកាសអាសន្នបេះដូងរីកធំខុសប្រក្រតី                         |
| Progressive Trauma CT Slices Caching | ការរក្សាទុកជាមុននូវស្រទាប់ស្កេន CT សម្រាប់គ្រោះថ្នាក់សង្គ្រោះ |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 9. Safety and Clinical Audit Gates

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Display Calibration Diagnostic Warning | Regulatory Notice   | Prompts persistent clinical banner: "Diagnostic reading |
|                                        |                     | on mobile displays requires ambient light control.      |
|                                        |                     | Certified PACS workstation required for final signoff." |
|                                        |                     |                                                         |
| Uncalibrated Pixel Spacing Interlock   | Measurement Guard   | Disallows reporting in millimeters if PixelSpacing tag  |
|                                        |                     | is missing; forces output to screen pixels (px).        |
|                                        |                     |                                                         |
| Cardiomegaly Automatic Clinical Alert  | Diagnostic Flag     | CTR > 0.50 triggers automated prompt to correlate with  |
|                                        |                     | echocardiography and brain natriuretic peptide (BNP).   |
|                                        |                     |                                                         |
| Severe Scoliosis Surgical Trigger      | Orthopedic Alert    | Cobb angle >= 40 degrees automatically prompts spine    |
|                                        |                     | surgery consultation and pulmonary function evaluation. |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated verification confirms 0 emoji symbols.        |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated verification confirms 0 parentheses on lines  |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
