# Cambodia NSSF Medical Tariff Master and PACS DICOM WebGL Technical Specification
Document Version: 2.0.0
Classification: Pure Enterprise Standard

---

## Section 1: Cambodia NSSF Medical Tariff Master Specification

### 1.1 Legal Framework and Operational Principles
The National Social Security Fund of Cambodia - បេឡាជាតិរបបសន្តិសុខសង្គម ហៅកាត់ថា ប.ស.ស. operates under the Law on Social Security Schemes and Joint Inter-Ministerial Prakas between the Ministry of Labour and Vocational Training (MoLVT) and the Ministry of Health (MoH).
Health facilities accredited by NSSF must submit standardized electronic claims conforming to:
1. Standard Service Act Nomenclature and Coefficients (French-derived K-factor and B-factor systems adapted by Cambodia MoH).
2. Maximum reimbursable ceilings established in Cambodian Riel (KHR).
3. Co-payment rules: 100% coverage for standard occupational risk and healthcare benefits; patient co-payment applies only to requested non-covered luxury amenities or non-formulary medications.
4. Pre-authorization requirements for elective high-cost surgical interventions and high-technology imaging (CT/MRI).

---

### 1.2 NSSF Medical Act Classification and Coefficient System

Cambodia NSSF categorizes medical procedures using intervention coefficients:
- General and Specialist Consultations: Base Tariff in KHR.
- Surgical Interventions: K-Coefficients (e.g., K5 to K150). The total reimbursable fee equals the base unit monetary value multiplied by the procedure coefficient K.
- Clinical Biology and Laboratory Tests: B-Coefficients (e.g., B5 to B60).
- Medical Imaging: R-Coefficients (e.g., R10 to R120).
- Hospitalization: Daily bed day allowance categorized by ward level (General Ward, Semi-Private, Intensive Care Unit ICU).

#### Base Unit Monetary Values (Standard NSSF Exchange Baseline)
- Base Unit Value for Surgical Interventions: 1 K-unit = 12,000 KHR
- Base Unit Value for Clinical Biology: 1 B-unit = 1,000 KHR
- Base Unit Value for Medical Imaging: 1 R-unit = 2,500 KHR

---

### 1.3 Master Tariff Table: Code Crosswalk and Reimbursable Ceilings

The master table below defines standard NSSF medical acts, corresponding ICD-10 indication mappings, intervention coefficients, and maximum reimbursable ceilings in Cambodian Riel (KHR).

| NSSF Act Code | Category | Description in English | Description in Khmer | Coefficient | Unit Value (KHR) | Maximum Ceiling (KHR) | Pre-Auth Required |
|---|---|---|---|---|---|---|---|
| NSSF-OPD-001 | Consultation | General Medical Consultation | ការពិគ្រោះជំងឺទូទៅ | - | Fixed | 20,000 | No |
| NSSF-OPD-002 | Consultation | Specialist Physician Consultation | ការពិគ្រោះជំងឺឯកទេស | - | Fixed | 40,000 | No |
| NSSF-OPD-003 | Consultation | Emergency Resuscitation Consultation | ការពិគ្រោះសង្គ្រោះបន្ទាន់ | - | Fixed | 60,000 | No |
| NSSF-IPD-001 | Hospitalization | General Ward Daily Bed Day | ថ្លៃគ្រែសម្រាកព្យាបាលបន្ទប់ទូទៅ | - | Fixed per Day | 45,000 | No |
| NSSF-IPD-002 | Hospitalization | Semi-Private Ward Bed Day | ថ្លៃគ្រែបន្ទប់ពាក់កណ្តាលឯកជន | - | Fixed per Day | 90,000 | Yes |
| NSSF-IPD-003 | Hospitalization | Intensive Care Unit (ICU) Daily Bed Day | ថ្លៃគ្រែសង្គ្រោះបន្ទាន់កម្រិតធ្ងន់ ICU | - | Fixed per Day | 250,000 | Yes |
| NSSF-SURG-K05 | Minor Surgery | Wound Debridement and Suture under 5cm | ការលាងសម្អាតនិងដេររបួសតូចក្រោម ៥សង់ទីម៉ែត្រ | K5 | 12,000 | 60,000 | No |
| NSSF-SURG-K15 | Minor Surgery | Abscess Drainage or Excision of Lipoma | ការវះបង្ហូរខ្ទុះឬវះកាត់ដុំពកខ្លាញ់ | K15 | 12,000 | 180,000 | No |
| NSSF-SURG-K30 | Intermediate Surgery | Closed Reduction of Long Bone Fracture | ការតម្រង់ឆ្អឹងបាក់ប្រភេទបិទជិត | K30 | 12,000 | 360,000 | No |
| NSSF-SURG-K50 | Major Surgery | Open Appendectomy | ការវះកាត់ខ្នែងពោះវៀនធម្មតា | K50 | 12,000 | 600,000 | No |
| NSSF-SURG-K75 | Major Surgery | Laparoscopic Cholecystectomy | ការវះកាត់ប្រមាត់ដោយឧបករណ៍ចោះ Laparoscopy | K75 | 12,000 | 900,000 | Yes |
| NSSF-SURG-K100 | Complex Surgery | Open Reduction Internal Fixation (ORIF) Femur | ការវះកាត់ភ្ជាប់ឆ្អឹងភ្លៅដោយដែកអ័រតូពេទិក | K100 | 12,000 | 1,200,000 | Yes |
| NSSF-SURG-K150 | Complex Surgery | Total Hip Arthroplasty | ការវះកាត់ប្តូរសន្លាក់ត្រគាកសិប្បនិម្មិត | K150 | 12,000 | 1,800,000 | Yes |
| NSSF-MAT-001 | Maternity | Normal Vaginal Delivery (Eutocic) | ការសម្រាលកូនធម្មតាដោយសុវត្ថិភាព | - | Fixed Package | 400,000 | No |
| NSSF-MAT-002 | Maternity | Caesarean Section Delivery (Dystocic) | ការសម្រាលកូនដោយវះកាត់ | K70 | 12,000 | 840,000 | Yes |
| NSSF-LAB-B05 | Laboratory | Fasting Blood Glucose (GLU) | វិភាគជាតិស្ករក្នុងឈាម | B5 | 1,000 | 5,000 | No |
| NSSF-LAB-B12 | Laboratory | Complete Blood Count (CBC 5-Diff) | វិភាគគ្រាប់ឈាមពេញលេញ CBC | B12 | 1,000 | 12,000 | No |
| NSSF-LAB-B15 | Laboratory | Serum Creatinine and Urea | វិភាគក្រេអាទីនីននិងអ៊ុយរ៉េ | B15 | 1,000 | 15,000 | No |
| NSSF-LAB-B20 | Laboratory | Serum Electrolytes (Na, K, Cl) | វិភាគអេឡិចត្រូលីតឈាម | B20 | 1,000 | 20,000 | No |
| NSSF-LAB-B30 | Laboratory | Liver Function Panel (ALT, AST, Bilirubin) | វិភាគមុខងារថ្លើមពេញលេញ | B30 | 1,000 | 30,000 | No |
| NSSF-LAB-B50 | Laboratory | Automated Blood Culture and Susceptibility | វិភាគបណ្តុះមេរោគក្នុងឈាមនិងតេស្តថ្នាំ | B50 | 1,000 | 50,000 | No |
| NSSF-IMG-R12 | Imaging | Chest Radiography PA Standing View | ថតកាំរស្មីអ៊ិចទ្រូងទិដ្ឋភាពឈរ | R12 | 2,500 | 30,000 | No |
| NSSF-IMG-R20 | Imaging | Plain Radiography of Extremity (2 Views) | ថតកាំរស្មីអ៊ិចឆ្អឹងអវយវៈពីរទិដ្ឋភាព | R20 | 2,500 | 50,000 | No |
| NSSF-IMG-R30 | Imaging | Complete Diagnostic Abdominal Ultrasound | ពិនិត្យអេកូសាស្ត្រពោះពេញលេញ | R30 | 2,500 | 75,000 | No |
| NSSF-IMG-R80 | Imaging | Non-Contrast Brain CT Scan | ស្កេនខួរក្បាល CT មិនប្រើជាតិពណ៌ | R80 | 2,500 | 200,000 | Yes |
| NSSF-IMG-R120 | Imaging | Contrast-Enhanced Abdominal CT Scan | ស្កេនពោះ CT បញ្ចូលជាតិពណ៌កម្រិតខ្ពស់ | R120 | 2,500 | 300,000 | Yes |

---

### 1.4 TypeScript Data Definitions for NSSF Master

```typescript
export type NssfActCategory =
  | 'CONSULTATION'
  | 'HOSPITALIZATION'
  | 'MINOR_SURGERY'
  | 'INTERMEDIATE_SURGERY'
  | 'MAJOR_SURGERY'
  | 'COMPLEX_SURGERY'
  | 'MATERNITY'
  | 'LABORATORY'
  | 'IMAGING';

export type CoefficientType = 'K_SURGICAL' | 'B_LABORATORY' | 'R_IMAGING' | 'FIXED_PACKAGE';

export interface NssfTariffItem {
  actCode: string;
  category: NssfActCategory;
  descriptionEn: string;
  descriptionKh: string;
  coefficientType: CoefficientType;
  coefficientValue: number;
  baseUnitValueKhr: number;
  maximumCeilingKhr: number;
  requiresPreAuthorization: boolean;
  defaultIcd10Indication?: string;
}

export interface NssfClaimLineItem {
  lineNumber: number;
  actCode: string;
  description: string;
  quantity: number;
  unitPriceKhr: number;
  totalPriceKhr: number;
  nssfCoveredKhr: number;
  patientCoPayKhr: number;
  adjudicationStatus: 'APPROVED' | 'PARTIAL' | 'REJECTED';
  rejectionReasonCode?: string;
}

export interface NssfClaimPayload {
  claimReference: string;
  nssfMemberBarcode: string;
  nationalIdNumber: string;
  patientFullNameKh: string;
  patientFullNameEn: string;
  patientGender: 'M' | 'F';
  patientBirthDate: string;
  healthFacilityCode: string;
  healthFacilityName: string;
  serviceType: 'OUTPATIENT' | 'INPATIENT' | 'EMERGENCY' | 'MATERNITY' | 'OCCUPATIONAL_INJURY';
  admissionTimestamp: string;
  dischargeTimestamp: string;
  primaryDiagnosisIcd10: string;
  secondaryDiagnosisIcd10?: string[];
  treatingDoctorLicense: string;
  preAuthReference?: string;
  lineItems: NssfClaimLineItem[];
  totalBilledKhr: number;
  totalClaimedKhr: number;
  totalPatientShareKhr: number;
  cryptographicSignature: string;
}
```

---

### 1.5 Cambodia MoH DHIS2 Communicable Disease Surveillance Schema

Cambodia Ministry of Health Communicable Disease Control (CDC MoH) mandates standardized reporting of acute and epidemic-prone communicable diseases into the National DHIS2 Instance.

#### Official Surveillance Diseases and DHIS2 DataElement UIDs
| ICD-10 Code | Disease Name in English | Disease Name in Khmer | Reporting Frequency | DHIS2 DataElement UID | Case Classification |
|---|---|---|---|---|---|
| A90 | Dengue Fever | គ្រុនឈាម : Dengue Fever | Weekly | DE_MOH_DENGUE_A90 | Suspected, Probable, Confirmed |
| B54 | Malaria Unspecified | គ្រុនចាញ់ : Malaria | Weekly | DE_MOH_MALARIA_B54 | Confirmed via RDT or Microscopy |
| A01.0 | Typhoid Fever | គ្រុនពោះវៀន : Typhoid Fever | Weekly | DE_MOH_TYPHOID_A01 | Probable, Confirmed via Blood Culture |
| A00.9 | Cholera Acute Watery Diarrhea | អាសន្នរោគ : Cholera | Immediate within 24 Hours | DE_MOH_CHOLERA_A00 | Suspected, Confirmed via Culture |
| A82.9 | Rabies | ជំងឺឆ្កែឆ្កួត : Rabies | Immediate within 24 Hours | DE_MOH_RABIES_A82 | Clinical, Confirmed |
| A15.0 | Tuberculosis Pulmonary | របេងសួត : Pulmonary Tuberculosis | Monthly | DE_MOH_TB_A15 | GeneXpert or Smear Positive |
| J06.9 | Severe Acute Respiratory Infection (SARI) | ការបង្ករោគផ្លូវដង្ហើមស្រួចស្រាវធ្ងន់ធ្ងរ SARI | Weekly | DE_MOH_SARI_J06 | Suspected, Confirmed via RT-PCR |
| B16.9 | Acute Hepatitis B | រលាកថ្លើមប្រភេទបេស្រួចស្រាវ Hepatitis B | Monthly | DE_MOH_HEPB_B16 | Confirmed via HBsAg and IgM anti-HBc |
| B05.9 | Measles | កញ្ជ្រឹល : Measles | Immediate within 24 Hours | DE_MOH_MEASLES_B05 | Suspected, Confirmed via Serology IgM |

#### DHIS2 JSON Payload Format for DataValueSets Endpoint
```json
{
  "dataSet": "DS_MOH_CAMBODIA_EPIDEMIC_SURVEILLANCE_V1",
  "completeDate": "2026-10-26",
  "period": "2026W42",
  "orgUnit": "OU_MOH_KH_PP_FAC_8819",
  "attributeOptionCombo": "AOC_DEFAULT_STANDARD",
  "dataValues": [
    {
      "dataElement": "DE_MOH_DENGUE_A90",
      "categoryOptionCombo": "COC_CONFIRMED_RDT_POSITIVE",
      "value": "14",
      "storedBy": "system_integration_daemon",
      "comment": "Confirmed dengue cases Mean Chey district"
    },
    {
      "dataElement": "DE_MOH_MALARIA_B54",
      "categoryOptionCombo": "COC_CONFIRMED_MICROSCOPY",
      "value": "0",
      "storedBy": "system_integration_daemon"
    },
    {
      "dataElement": "DE_MOH_SARI_J06",
      "categoryOptionCombo": "COC_HOSPITALIZED_UNDER_5",
      "value": "6",
      "storedBy": "system_integration_daemon"
    },
    {
      "dataElement": "DE_MOH_CHOLERA_A00",
      "categoryOptionCombo": "COC_SUSPECTED_ZERO_ALERT",
      "value": "0",
      "storedBy": "system_integration_daemon"
    }
  ]
}
```

---

## Section 2: PACS DICOM WebGL Shader & Caliper Geometry Specification

### 2.1 Standard Diagnostic Window Width and Window Level (WW/WL) Presets

The window width (WW) and window level (WL, also known as window center WC) dictate the contrast and brightness transfer function mapping raw radiological Hounsfield Units (HU) to screen luminance:

| Preset Identifier | Anatomical Target | Window Width (WW) | Window Level (WL/WC) | Modality | Clinical Diagnostic Purpose |
|---|---|---|---|---|---|
| BONE_CORTICAL | Cortical and Trabecular Bone | 2000 | 500 | CT, DX, CR | Evaluation of cortical bone fractures, micro-trabecular disruptions, osteophytes, and osteolysis |
| LUNG_PARENCHYMA | Pulmonary Parenchyma and Bronchi | 1500 | -600 | CT | Visualization of subpleural ground-glass opacities, interstitial lung disease, pneumothorax, and emphysema |
| SOFT_TISSUE | Abdominal Viscera and Mediastinum | 350 | 40 | CT | Delineation of hepatic, splenic, pancreatic parenchyma, lymphadenopathy, and vascular borders |
| BRAIN_PARENCHYMA | Cerebral Cortex and Deep Nuclei | 80 | 40 | CT | High-contrast differentiation between cerebral gray matter and white matter, early ischemic edema |
| SUBDURAL_EPIDURAL | Intracranial Hemorrhage | 150 | 75 | CT | Differentiating hyperdense acute extra-axial blood clots from the adjacent hyperdense calvarium |
| LIVER_SPECIFIC | Hepatic Steatosis and Metastases | 150 | 30 | CT | High dynamic sensitivity for focal hypodense liver lesions against fatty parenchymal background |
| CHEST_XRAY_STANDARD | Digital Thoracic Radiography | 4096 | 2048 | DX, CR | Optimal balance of vascular lung markings, cardiac borders, and thoracic cage in 12-bit radiographic studies |

---

### 2.2 Mathematical Transfer Functions

#### 1. Linear Ramp Transfer Function
Given:
- $p$: Raw 16-bit integer pixel value stored in DICOM file
- $S$: Rescale Slope (DICOM tag `0028,1053`)
- $I$: Rescale Intercept (DICOM tag `0028,1052`)
- $W$: Window Width (DICOM tag `0028,1051`)
- $C$: Window Center (DICOM tag `0028,1050`)

The Hounsfield Unit (HU) is computed as:
$$HU = p \cdot S + I$$

The lower and upper bounds of the linear dynamic range are defined by the DICOM Part 3 C.11.2 standard:
$$y_{\text{bottom}} = C - 0.5 - \frac{W - 1}{2}$$
$$y_{\text{top}} = C - 0.5 + \frac{W - 1}{2}$$

The output normalized display grayscale intensity $y_{\text{out}} \in [0.0, 1.0]$ is:
$$y_{\text{out}} = \begin{cases} 
0.0 & \text{if } HU \leq y_{\text{bottom}} \\
\frac{HU - y_{\text{bottom}}}{y_{\text{top}} - y_{\text{bottom}}} & \text{if } y_{\text{bottom}} < HU \leq y_{\text{top}} \\
1.0 & \text{if } HU > y_{\text{top}}
\end{cases}$$

#### 2. Sigmoidal Transfer Function (Smooth Non-Linear Soft Tissue Rendering)
When VOI LUT Function is set to `SIGMOID`, the transfer curve reduces harsh clipping at extremes:
$$y_{\text{sigmoid}} = \frac{1.0}{1.0 + \exp\left( -4.0 \cdot \frac{HU - C}{W} \right)}$$

---

### 2.3 WebGL 2.0 Hardware-Accelerated Fragment Shader (GLSL ES 3.00)

```glsl
#version 300 es
precision highp float;
precision highp int;

// 16-bit unsigned or signed integer DICOM texture
uniform highp usampler2D u_dicomTexture;

// DICOM Modality LUT parameters
uniform float u_rescaleSlope;
uniform float u_rescaleIntercept;

// DICOM VOI Window parameters
uniform float u_windowCenter;
uniform float u_windowWidth;

// Invert toggle (true for bones black / air white inverted mode)
uniform bool u_invert;

// Output display mode: 0 = Linear Ramp, 1 = Sigmoid
uniform int u_voiLutFunction;

in vec2 v_texCoord;
out vec4 fragColor;

void main() {
    // 1. Fetch raw 16-bit integer pixel value from texture channel R
    uint rawPixel = texture(u_dicomTexture, v_texCoord).r;
    
    // 2. Convert to Hounsfield Units (HU)
    float hu = float(rawPixel) * u_rescaleSlope + u_rescaleIntercept;
    
    // 3. Apply Windowing Algorithm
    float intensity = 0.0;
    
    if (u_voiLutFunction == 0) {
        // Linear Ramp DICOM Standard
        float lower = u_windowCenter - 0.5 - (u_windowWidth - 1.0) / 2.0;
        float upper = u_windowCenter - 0.5 + (u_windowWidth - 1.0) / 2.0;
        
        intensity = clamp((hu - lower) / (upper - lower), 0.0, 1.0);
    } else {
        // Sigmoid LUT
        intensity = 1.0 / (1.0 + exp(-4.0 * (hu - u_windowCenter) / u_windowWidth));
        intensity = clamp(intensity, 0.0, 1.0);
    }
    
    // 4. Handle inversion if requested
    if (u_invert) {
        intensity = 1.0 - intensity;
    }
    
    // 5. Output monochrome grayscale to RGB channels
    fragColor = vec4(vec3(intensity), 1.0);
}
```

---

### 2.4 Calibrated Caliper Geometry Equations using Pixel Spacing

#### 1. Pixel Spacing Tag Definition
DICOM tag `(0028,0030)` `Pixel Spacing` provides two floating-point numbers specifying the physical distance between the centers of adjacent pixels in the patient:
- $S_{\text{row}}$: Row Spacing, the physical distance between adjacent rows (vertical resolution, $\Delta y$ in mm).
- $S_{\text{col}}$: Column Spacing, the physical distance between adjacent columns (horizontal resolution, $\Delta x$ in mm).

#### 2. Euclidean Linear Distance Caliper
Given two measured points on the WebGL canvas:
$$P_1 = (x_1, y_1), \quad P_2 = (x_2, y_2)$$

The coordinate differences in pixel units are:
$$\Delta x = |x_2 - x_1|, \quad \Delta y = |y_2 - y_1|$$

The true calibrated physical distance in millimeters is computed using the spatial metric tensor:
$$D_{\text{mm}} = \sqrt{ (\Delta x \cdot S_{\text{col}})^2 + (\Delta y \cdot S_{\text{row}})^2 }$$

---

### 2.5 Calibrated Cardiothoracic Ratio (CTR) Measurement Geometry

The Cardiothoracic Ratio (CTR) is measured on posterior-anterior (PA) chest radiographs to assess cardiomegaly.

```
                    Thoracic Midline (Vertical Axis)
                                  |
         |------------------------+-------------------|  <- Thoracic Cavity Top
         |                        |                   |
         |                        |                   |
         |       MRD              |        MLD        |
         |   <--------->          |   <----------->   |
         |              +---------+---------+         |
         |             /          |          \        |
         |            (           |           )       |  <- Cardiac Silhouette
         |             \          |          /        |
         |              +---------+---------+         |
         |                        |                   |
         |<-----------------------+------------------>|  <- Max Thoracic Diameter (MTD)
         |                        |                   |
        Left Costophrenic         |                  Right Costophrenic
```

#### Analytical Equations for CTR
1. **Midline Reference Line**: A vertical axis $L_{\text{midline}}$ drawn along the spinous processes of the thoracic vertebrae.
2. **Maximum Right Distance (MRD)**: The maximum perpendicular horizontal distance from the midline to the rightmost cardiac border:
   $$\text{MRD}_{\text{mm}} = \max_{i} |x_{\text{right\_heart}, i} - x_{\text{midline}}| \cdot S_{\text{col}}$$
3. **Maximum Left Distance (MLD)**: The maximum perpendicular horizontal distance from the midline to the leftmost cardiac border (cardiac apex):
   $$\text{MLD}_{\text{mm}} = \max_{j} |x_{\text{left\_heart}, j} - x_{\text{midline}}| \cdot S_{\text{col}}$$
4. **Total Cardiac Transverse Diameter (MCD)**:
   $$\text{MCD}_{\text{mm}} = \text{MRD}_{\text{mm}} + \text{MLD}_{\text{mm}}$$
5. **Maximum Internal Thoracic Diameter (MTD)**: The widest internal transverse distance between the inner surfaces of the ribs at the level of the right hemidiaphragm:
   $$\text{MTD}_{\text{mm}} = |x_{\text{rib\_inner\_right}} - x_{\text{rib\_inner\_left}}| \cdot S_{\text{col}}$$
6. **Cardiothoracic Ratio Formula**:
   $$\text{CTR} = \frac{\text{MCD}_{\text{mm}}}{\text{MTD}_{\text{mm}}} = \frac{\text{MRD}_{\text{mm}} + \text{MLD}_{\text{mm}}}{\text{MTD}_{\text{mm}}}$$

#### Diagnostic Classification
- $\text{CTR} \leq 0.50$: Normal cardiac silhouette.
- $0.50 < \text{CTR} \leq 0.55$: Borderline cardiomegaly.
- $\text{CTR} > 0.55$: Definite cardiomegaly. Echocardiographic evaluation recommended.

---

### 2.6 Spinal Cobb Angle Geometry Equations

The Cobb angle quantifies coronal spinal scoliosis from standing anterior-posterior (AP) radiographs.

```
        Upper Vertebra Superior Endplate Line (L1)
             A ----------------------- B  (Slope m1)
                \                   /
                 \                 /
                  \   Vertebrae   /
                   \             /
                    \           /
                     \         /
             C ----------------------- D  (Slope m2)
        Lower Vertebra Inferior Endplate Line (L2)
```

#### Analytical Equation for Cobb Angle
Given two anatomical lines drawn by the clinician:
- Line 1: Endplate of the superior end vertebra, defined by points $A(x_1, y_1)$ and $B(x_2, y_2)$
- Line 2: Endplate of the inferior end vertebra, defined by points $C(x_3, y_3)$ and $D(x_4, y_4)$

The physical vector components in metric millimeters are:
$$\vec{v}_1 = \begin{bmatrix} (x_2 - x_1) \cdot S_{\text{col}} \\ (y_2 - y_1) \cdot S_{\text{row}} \end{bmatrix}, \quad \vec{v}_2 = \begin{bmatrix} (x_4 - x_3) \cdot S_{\text{col}} \\ (y_4 - y_3) \cdot S_{\text{row}} \end{bmatrix}$$

The cosine of the angle $\theta$ between the two lines is calculated via the Euclidean dot product:
$$\cos(\theta) = \frac{\vec{v}_1 \cdot \vec{v}_2}{\|\vec{v}_1\| \|\vec{v}_2\|} = \frac{v_{1x} v_{2x} + v_{1y} v_{2y}}{\sqrt{v_{1x}^2 + v_{1y}^2} \sqrt{v_{2x}^2 + v_{2y}^2}}$$

The Cobb angle $\theta_{\text{deg}}$ in degrees is:
$$\theta_{\text{deg}} = \arccos\left( \text{clamp}\left( \cos(\theta), -1.0, 1.0 \right) \right) \cdot \left( \frac{180.0}{\pi} \right)$$

If $\theta_{\text{deg}} > 90^\circ$, the acute supplementary angle is used:
$$\theta_{\text{Cobb}} = 180^\circ - \theta_{\text{deg}}$$

#### Clinical Scoliosis Severity Stratification
- $\theta_{\text{Cobb}} < 10^\circ$: Normal physiological spinal alignment (no structural scoliosis).
- $10^\circ \leq \theta_{\text{Cobb}} < 25^\circ$: Mild scoliosis. Serial radiographic observation indicated.
- $25^\circ \leq \theta_{\text{Cobb}} < 40^\circ$: Moderate scoliosis. Orthopedic bracing and active rehabilitation indicated.
- $\theta_{\text{Cobb}} \geq 40^\circ$: Severe scoliosis. Surgical spinal instrumentation and fusion consultation indicated.

---

### 2.7 Region of Interest (ROI) Quantitative Densitometry

When a radiologist draws a closed polygonal or elliptical ROI containing $N$ pixels:
1. **Area in Square Millimeters**:
   $$\text{Area}_{\text{mm}^2} = N \cdot S_{\text{col}} \cdot S_{\text{row}}$$
2. **Mean Hounsfield Unit (Mean HU)**:
   $$\mu_{\text{HU}} = \frac{1}{N} \sum_{i=1}^{N} \text{HU}_i$$
3. **Standard Deviation of Hounsfield Units (HU Heterogeneity)**:
   $$\sigma_{\text{HU}} = \sqrt{ \frac{1}{N} \sum_{i=1}^{N} (\text{HU}_i - \mu_{\text{HU}})^2 }$$

Diagnostic utility:
- Hepatic steatosis: Liver parenchymal $\mu_{\text{HU}} < 40\text{ HU}$ or Liver-Spleen differential $< -10\text{ HU}$.
- Renal cyst differentiation: Simple cyst $\mu_{\text{HU}} \in [0, 20\text{ HU}]$; Solid renal cell carcinoma $\mu_{\text{HU}} > 35\text{ HU}$ with contrast enhancement $> 15\text{ HU}$.
- Adrenal adenoma: Unenhanced lipid-rich adenoma $\mu_{\text{HU}} \leq 10\text{ HU}$.

---

## Section 3: Integration Architecture with Clinic Backend Services

```
+-------------------------------------------------------------------------------+
|                       WEBGL PACS WORKSTATION (FRONTEND)                       |
|  +---------------------------+  +------------------------------------------+  |
|  | DICOM P10 WebAssembly     |  | WebGL 2.0 Fragment Shader                |  |
|  | Raw 16-bit Pixel Parser   |  | WW/WL Presets (Bone, Lung, Soft, Brain)  |  |
|  +---------------------------+  +------------------------------------------+  |
|  +-------------------------------------------------------------------------+  |
|  | Caliper Measurement Engine (Pixel Spacing tag 0028,0030)               |  |
|  | Linear Distance, Cardiothoracic Ratio (CTR), Cobb Angle, ROI Density   |  |
|  +-------------------------------------------------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        | REST / WADO-RS
                                        v
+-------------------------------------------------------------------------------+
|                        NESTJS CLINICAL BACKEND CORE                           |
|  +----------------------------------+  +-----------------------------------+  |
|  | PacsService                      |  | EclaimService                     |  |
|  | DicomStudy & Instance Records    |  | Cambodia NSSF Master Tariff Table |  |
|  | Storage Path / Encrypted Vault   |  | DHIS2 Weekly Surveillance Worker  |  |
|  +----------------------------------+  +-----------------------------------+  |
+---------------------------------------+---------------------------------------+
                                        | Prisma ORM
                                        v
+-------------------------------------------------------------------------------+
|                     POSTGRESQL DATABASE (MULTI-TENANT)                        |
|  - DicomStudyRecord, DicomInstanceRecord, DicomMeasurementRecord              |
|  - InsuranceClaimRecord, ClaimLineItemRecord, SurveillanceCaseRecord          |
+-------------------------------------------------------------------------------+
```

All data models, geometry calculations, and master tariff codes defined in this document are ready for direct implementation in the clinic patient management platform.
