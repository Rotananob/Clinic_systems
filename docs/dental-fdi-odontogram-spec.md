# FDI World Dental Federation Odontogram and Periodontal Charting Engine Specification
Document Identifier: DENTAL-FDI-ODONTOGRAM-SPEC-2026-V1
Compliance Standards: ISO 3950 Designation System for Teeth, FDI Two-Digit Notation, WHO Oral Health Surveys 5th Edition, AAP/EFP 2018 Classification of Periodontal Diseases
Classification: Enterprise Standard Mobile Dental Electronic Medical Record (Dental EMR) and Oral Surgery Clinical Decision Support

---

## 1. Executive Summary and System Architecture

### 1.1 Clinical Rationale
Oral diseases - including dental caries, advanced periodontitis, and edentulism - are among the most prevalent non-communicable conditions globally. In hospital dental departments, private dental polyclinics, and mobile rural dental outreach missions across Cambodia, accurate anatomical charting of permanent and primary dentition is foundational for treatment planning, forensic identification, NSSF dental claim reimbursement, and epidemiological oral health surveillance.

The FDI Odontogram and Periodontal Charting Engine delivers:
1. ISO 3950 / FDI Two-Digit tooth identification for 32 permanent and 20 deciduous teeth.
2. 5-Surface anatomical geometric segmentation per tooth (Occlusal/Incisal, Mesial, Distal, Buccal/Facial, Lingual/Palatal).
3. Standardized clinical condition classification and color tokens (Sound, Caries, Restorations, Crowns, Endodontics, Implants, Bridges).
4. Periodontal charting: 6-site probing pocket depth (1 to 9 mm), bleeding on probing (BOP), Glickman furcation, and Miller tooth mobility.
5. Automated epidemiological scoring: WHO DMFT index for adults and dft/def index for pediatric patients.
6. Mobile Android Jetpack Compose interactive touch-surface odontogram rendering.

```
+----------------------------------------------------------------------------------------------------+
|                         KRUPET DENTAL ODONTOGRAM AND PERIODONTAL ENGINE                            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL DENTAL EXAM & TOUCH ODONTOGRAM INPUT - MOBILE TABLET ]                                 |
|  - Patient Age, Dentition Stage: Permanent, Mixed, or Primary / Deciduous                         |
|  - Interactive 2D Vector / Compose Dental Arch: Tooth selection (FDI 11-48, 51-85)                 |
|  - 5-Surface Multi-Select: Occlusal, Mesial, Distal, Buccal, Lingual                               |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | DENTAL RESTORATIVE & SURGICAL PATHOLOGY ENGINE                                                | |
|  | - Classifies tooth state: Sound, Caries, Composite, Amalgam, Crown, Root Canal, Implant, Bridge | |
|  | - Renders standardized clinical color tokens on vector tooth facets                            | |
|  | - Links restorative findings to NSSF Dental Tariff codes and MoH procedure catalogues         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | PERIODONTAL 6-SITE PROBING & MOBILITY MATRIX                                                  | |
|  | - 6-Site Probing Depths: Disto-Buccal, Mid-Buccal, Mesio-Buccal, Disto-Lingual, Mid-L, Mesio-L   | |
|  | - Bleeding on Probing (BOP %): Automated full-mouth bleeding score calculation                  | |
|  | - Glickman Furcation (Class I-IV) and Miller Tooth Mobility (Class 1-3)                         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | WHO EPIDEMIOLOGICAL ORAL HEALTH CALCULATOR                                                    | |
|  | - DMFT Index: D (Decayed) + M (Missing carious) + F (Filled) for permanent teeth                | |
|  | - dft / def Index: d (Decayed) + f (Filled) for pediatric primary teeth                        | |
|  | - Categorizes WHO Population Caries Severity: Very Low, Low, Moderate, High, Very High         | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ NSSF DENTAL CLAIM & TREATMENT PLAN GENERATION ]                                                 |
|  - Itemized tooth-specific billing with K/B coefficients, pre-op and post-op digital signoffs      |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. FDI Two-Digit World Dental Federation Notation (ISO 3950)

The FDI system assigns each tooth a unique two-digit integer code:
- First Digit (Quadrant):
  * Permanent Dentition: Quadrants 1 to 4 (clockwise from maxillary right to mandibular right).
  * Primary / Deciduous Dentition: Quadrants 5 to 8 (clockwise from maxillary right to mandibular right).
- Second Digit (Tooth Position):
  * Permanent Dentition: 1 (Central Incisor) to 8 (Third Molar / Wisdom Tooth).
  * Primary Dentition: 1 (Central Incisor) to 5 (Second Molar).

```
+----------------------------------------------------------------------------------------------------+
|                                    PERMANENT DENTITION (32 TEETH)                                  |
+----------------------------------------------------------------------------------------------------+
| Quadrant 1 (Maxillary Right): 18, 17, 16, 15, 14, 13, 12, 11 | 21, 22, 23, 24, 25, 26, 27, 28 (Q2) |
| -------------------------------------------------------------+------------------------------------ |
| Quadrant 4 (Mandibular Right): 48, 47, 46, 45, 44, 43, 42, 41 | 31, 32, 33, 34, 35, 36, 37, 38 (Q3) |
+----------------------------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------------------------+
|                                    DECIDUOUS DENTITION (20 TEETH)                                  |
+----------------------------------------------------------------------------------------------------+
| Quadrant 5 (Maxillary Right): 55, 54, 53, 52, 51             | 61, 62, 63, 64, 65 (Q6 Max Left)   |
| -------------------------------------------------------------+------------------------------------ |
| Quadrant 8 (Mandibular Right): 85, 84, 83, 82, 81             | 71, 72, 73, 74, 75 (Q7 Mand Left)  |
+----------------------------------------------------------------------------------------------------+
```

---

## 3. Five Anatomical Surfaces per Tooth

Every tooth crown is segmented into five anatomical surfaces:
1. Occlusal (O) or Incisal (I):
   - Occlusal: Masticatory biting surface of posterior premolars and molars.
   - Incisal: Cutting edge of anterior incisors and canines.
2. Mesial (M):
   - Proximal surface oriented toward the anterior dental midline along the arch.
3. Distal (D):
   - Proximal surface oriented away from the anterior dental midline toward the posterior.
4. Buccal (B) or Facial/Labial (F/La):
   - Buccal: Outer surface facing the cheek (premolars and molars).
   - Facial / Labial: Outer surface facing the lips (incisors and canines).
5. Lingual (L) or Palatal (P):
   - Lingual: Inner surface facing the tongue (mandibular teeth).
   - Palatal: Inner surface facing the hard palate (maxillary teeth).

---

## 4. Clinical Condition Classification and Visual Color Tokens

The mobile odontogram renders each tooth and individual surface using strict, high-contrast clinical color tokens:

```
+------------------------------------+------------+-------------------------------------------------------------+
| Clinical Condition                 | Hex Token  | Graphical Rendering and Clinical Meaning                    |
+------------------------------------+------------+-------------------------------------------------------------+
| 1. Sound / Healthy Tooth           | #FFFFFF    | White fill with dark slate boundary. Free of active decay.  |
|                                    | (Border 33)|                                                             |
|                                    |            |                                                             |
| 2. Dental Caries / Active Cavity   | #D32F2F    | Solid crimson red fill on affected surfaces (O, M, D, B, L).|
|                                    | (Crimson)  | Indicates active enamel or dentinal cavitation.             |
|                                    |            |                                                             |
| 3. Existing Amalgam Restoration    | #455A64    | Dark charcoal slate fill on restored facets.                |
|                                    | (Slate)    | Intact metallic silver-mercury filling.                     |
|                                    |            |                                                             |
| 4. Existing Composite Restoration  | #2E7D32    | Forest green outline / mint tint on restored facets.        |
|                                    | (Green)    | Tooth-colored resin or glass ionomer filling.               |
|                                    |            |                                                             |
| 5. Porcelain / Zirconia Crown      | #FFA000    | Full golden amber circumference encasing all 5 surfaces.    |
|                                    | (Amber)    | Complete extra-coronal prosthetic coverage.                 |
|                                    |            |                                                             |
| 6. Endodontic Root Canal Treated   | #7B1FA2    | Solid violet root canal line extending through root apex.   |
|                                    | (Purple)   | Pulpectomy with gutta-percha obturation.                    |
|                                    |            |                                                             |
| 7. Missing / Extracted Tooth       | #9E9E9E    | Bold diagonal cross (X) across entire tooth schematic.      |
|                                    | (Grey X)   | Tooth lost due to caries, trauma, or periodontal disease.   |
|                                    |            |                                                             |
| 8. Impacted / Unerupted Tooth      | #0288D1    | Blue circular dashed perimeter encasing tooth.              |
|                                    | (Cyan)     | Retained in alveolar bone (frequently third molars 18, 48). |
|                                    |            |                                                             |
| 9. Bridge Pontic (Artificial)      | #E64A19    | Orange solid fill with horizontal connecting pontic bar.    |
|                                    | (Orange)   | Suspended prosthetic tooth replacing missing unit.          |
|                                    |            |                                                             |
| 10. Dental Implant                 | #1976D2    | Threaded screw glyph centered below artificial crown.       |
|                                    | (Cobalt)   | Osteointegrated titanium / zirconia fixture.                |
+------------------------------------+------------+-------------------------------------------------------------+
```

---

## 5. Periodontal Charting Engine

The periodontal module records subgingival micro-environment measurements across six standardized circumferential probe sites per tooth:
- Facial / Buccal Sites: Disto-Buccal (DB), Mid-Buccal (B), Mesio-Buccal (MB)
- Lingual / Palatal Sites: Disto-Lingual (DL), Mid-Lingual (L), Mesio-Lingual (ML)

### 5.1 Probing Pocket Depth (PPD in mm)
Measured using a calibrated periodontal probe (e.g., UNC-15 or WHO probe) from the gingival margin to the base of the gingival sulcus:
- Normal Health: $1\text{ to }3\text{ mm}$ (Gingival sulcus within physiological limits).
- Mild Periodontitis: $4\text{ to }5\text{ mm}$ (Active subgingival pocketing, bone loss).
- Severe Periodontitis: $\ge 6\text{ mm}$ (Deep infrabony defects, advanced attachment loss).

### 5.2 Bleeding on Probing (BOP) and Full-Mouth Bleeding Score (FMBS)
BOP is evaluated within 30 seconds of probing (indicates active subgingival microvascular ulceration and inflammation):

$$\text{FMBS (\%)} = \left(\frac{\text{Total Sites with Bleeding on Probing}}{\text{Total Probed Sites in Dentition}}\right) \times 100$$

Where $\text{Total Probed Sites} = \text{Total Present Teeth} \times 6$.
- Clinical Benchmark: $\text{FMBS} < 10\%$ represents stable, healthy periodontium; $\text{FMBS} \ge 25\%$ indicates high risk of active periodontal disease progression.

### 5.3 Glickman Classification of Furcation Involvement
Applies to multi-rooted molars and maxillary premolars:
- Class I: Incipient bone loss; probe enters the furcation groove but cannot penetrate horizontally $> 1\text{ mm}$.
- Class II: Cul-de-sac; probe penetrates horizontally $> 3\text{ mm}$ into inter-radicular bone but not through-and-through.
- Class III: Through-and-through bone loss; probe passes completely through the inter-radicular space from buccal to lingual.
- Class IV: Through-and-through bone loss with gingival recession exposing the furcation entrance to direct clinical vision.

### 5.4 Miller's Classification of Tooth Mobility
Evaluated using the handles of two rigid dental instruments:
- Class 0: Normal physiological mobility ($\le 0.2\text{ mm}$).
- Class 1: Horizontal crown mobility between $0.2\text{ mm}$ and $1.0\text{ mm}$ in bucco-lingual direction.
- Class 2: Horizontal crown mobility $> 1.0\text{ mm}$ in bucco-lingual direction without axial displacement.
- Class 3: Severe horizontal mobility $> 1.0\text{ mm}$ combined with vertical (axial) depressibility in alveolar socket.

---

## 6. Automated WHO Epidemiological Indices

### 6.1 DMFT Index for Adult Permanent Dentition
The DMFT index standardizes dental caries experience across populations:

$$\text{DMFT} = D + M + F$$

Where:
- $D$ (Decayed): Count of permanent teeth with untreated cavitated carious lesions.
- $M$ (Missing): Count of permanent teeth extracted specifically due to caries. (Teeth extracted for orthodontic therapy, impaction, or severe trauma are excluded).
- $F$ (Filled): Count of permanent teeth with one or more restorations and zero recurrent caries.
- Third molars (teeth 18, 28, 38, 48) and unerupted teeth are excluded in standard WHO surveys. Maximum score: 28 teeth (or 32 if third molars included).

#### WHO Population Severity Tiers for 12-Year-Old Children:
- Very Low: $\text{DMFT} < 1.2$
- Low: $\text{DMFT } 1.2 - 2.6$
- Moderate: $\text{DMFT } 2.7 - 4.4$
- High: $\text{DMFT } 4.5 - 6.5$
- Very High: $\text{DMFT} > 6.5$

### 6.2 dft / def Index for Pediatric Primary Dentition
Evaluated for children aged 2 to 10 years across the 20 primary teeth (teeth 51-55, 61-65, 71-75, 81-85):

$$\text{dft} = d + f$$

Where:
- $d$ = Decayed primary teeth with active cavitation.
- $e$ / $m$ = Primary teeth extracted due to caries prior to expected natural exfoliation.
- $f$ = Filled primary teeth without recurrent caries.
- Maximum score: 20 teeth.

---

## 7. Production-Grade Kotlin Serialization Models & Odontogram Engine

```kotlin
package com.krupet.clinic.core.model.dental

import kotlinx.serialization.Serializable

/**
 * KruPet Clinical Mobile - FDI Odontogram and Periodontal Models
 * File: DentalOdontogramModels.kt
 *
 * Strict Compliance:
 * - Strictly ZERO emojis anywhere.
 * - Strictly NO parentheses in Khmer text strings.
 */

@Serializable
enum class ToothSurface {
    OCCLUSAL_INCISAL,
    MESIAL,
    DISTAL,
    BUCCAL_FACIAL,
    LINGUAL_PALATAL
}

@Serializable
enum class DentalConditionType(val hexColor: String) {
    SOUND("#FFFFFF"),
    CARIES("#D32F2F"),
    RESTORED_AMALGAM("#455A64"),
    RESTORED_COMPOSITE("#2E7D32"),
    CROWN_PORCELAIN_ZIRCONIA("#FFA000"),
    ROOT_CANAL_TREATED("#7B1FA2"),
    MISSING_EXTRACTED("#9E9E9E"),
    IMPACTED_UNERUPTED("#0288D1"),
    BRIDGE_PONTIC("#E64A19"),
    IMPLANT_TITANIUM("#1976D2")
}

@Serializable
enum class GlickmanFurcation {
    NONE,
    CLASS_I,
    CLASS_II,
    CLASS_III,
    CLASS_IV
}

@Serializable
enum class MillerMobility {
    CLASS_0_NORMAL,
    CLASS_1_MILD,
    CLASS_2_MODERATE,
    CLASS_3_SEVERE
}

@Serializable
data class PeriodontalSiteData(
    val probingDepthMm: Int,          // 1 to 9 mm
    val bleedingOnProbing: Boolean
)

@Serializable
data class ToothPeriodontalRecord(
    val distoBuccal: PeriodontalSiteData,
    val midBuccal: PeriodontalSiteData,
    val mesioBuccal: PeriodontalSiteData,
    val distoLingual: PeriodontalSiteData,
    val midLingual: PeriodontalSiteData,
    val mesioLingual: PeriodontalSiteData,
    val furcation: GlickmanFurcation = GlickmanFurcation.NONE,
    val mobility: MillerMobility = MillerMobility.CLASS_0_NORMAL
)

@Serializable
data class ToothChartEntity(
    val fdiNumber: Int,               // e.g. 11 to 48, or 51 to 85
    val isPrimaryDeciduous: Boolean,
    val primaryCondition: DentalConditionType,
    val surfaceConditions: Map<ToothSurface, DentalConditionType> = emptyMap(),
    val periodontalRecord: ToothPeriodontalRecord? = null,
    val clinicalNotes: String? = null
)

@Serializable
data class FullMouthOdontogram(
    val patientUpid: String,
    val examinationTimestampIso: String,
    val examiningDentistLicenseNo: String,
    val teeth: Map<Int, ToothChartEntity>,
    val dmftIndex: DmftScore,
    val pediatricDftIndex: PediatricDftScore? = null,
    val fullMouthBleedingPercent: Float
)

@Serializable
data class DmftScore(
    val decayedCount: Int,
    val missingCount: Int,
    val filledCount: Int,
    val totalDmft: Int,
    val whoSeverityTierEn: String,
    val whoSeverityTierKh: String
)

@Serializable
data class PediatricDftScore(
    val decayedPrimaryCount: Int,
    val filledPrimaryCount: Int,
    val totalDft: Int
)

object DentalCalculators {

    /**
     * Calculates WHO DMFT index for permanent dentition
     */
    fun calculateDmft(teeth: Map<Int, ToothChartEntity>): DmftScore {
        var decayed = 0
        var missing = 0
        var filled = 0

        for ((fdi, tooth) in teeth) {
            // Only permanent teeth: 11-18, 21-28, 31-38, 41-48
            if (tooth.isPrimaryDeciduous || fdi > 48) continue

            // Exclude third molars 18, 28, 38, 48 from standard WHO DMFT
            if (fdi in listOf(18, 28, 38, 48)) continue

            val hasCaries = tooth.primaryCondition == DentalConditionType.CARIES ||
                            tooth.surfaceConditions.values.any { it == DentalConditionType.CARIES }

            val isFilled = tooth.primaryCondition in listOf(
                DentalConditionType.RESTORED_AMALGAM,
                DentalConditionType.RESTORED_COMPOSITE,
                DentalConditionType.CROWN_PORCELAIN_ZIRCONIA
            ) || tooth.surfaceConditions.values.any {
                it in listOf(DentalConditionType.RESTORED_AMALGAM, DentalConditionType.RESTORED_COMPOSITE)
            }

            if (hasCaries) {
                decayed++
            } else if (tooth.primaryCondition == DentalConditionType.MISSING_EXTRACTED) {
                missing++
            } else if (isFilled) {
                filled++
            }
        }

        val total = decayed + missing + filled

        val tierEn = when {
            total < 1.2f -> "Very Low Caries Severity"
            total <= 2.6f -> "Low Caries Severity"
            total <= 4.4f -> "Moderate Caries Severity"
            total <= 6.5f -> "High Caries Severity"
            else -> "Very High Caries Severity"
        }

        val tierKh = when {
            total < 1.2f -> "កម្រិតជំងឺពុកធ្មេញទាបបំផុត"
            total <= 2.6f -> "កម្រិតជំងឺពុកធ្មេញទាប"
            total <= 4.4f -> "កម្រិតជំងឺពុកធ្មេញមធ្យម"
            total <= 6.5f -> "កម្រិតជំងឺពុកធ្មេញខ្ពស់"
            else -> "កម្រិតជំងឺពុកធ្មេញខ្ពស់បំផុត"
        }

        return DmftScore(
            decayedCount = decayed,
            missingCount = missing,
            filledCount = filled,
            totalDmft = total,
            whoSeverityTierEn = tierEn,
            whoSeverityTierKh = tierKh
        )
    }

    /**
     * Calculates Full-Mouth Bleeding on Probing (FMBS %)
     */
    fun calculateFmbsPercent(teeth: Map<Int, ToothChartEntity>): Float {
        var totalSites = 0
        var bleedingSites = 0

        for ((_, tooth) in teeth) {
            val perio = tooth.periodontalRecord ?: continue
            totalSites += 6

            if (perio.distoBuccal.bleedingOnProbing) bleedingSites++
            if (perio.midBuccal.bleedingOnProbing) bleedingSites++
            if (perio.mesioBuccal.bleedingOnProbing) bleedingSites++
            if (perio.distoLingual.bleedingOnProbing) bleedingSites++
            if (perio.midLingual.bleedingOnProbing) bleedingSites++
            if (perio.mesioLingual.bleedingOnProbing) bleedingSites++
        }

        if (totalSites == 0) return 0.0f
        val percent = (bleedingSites.toFloat() / totalSites.toFloat()) * 100.0f
        return Math.round(percent * 10.0f) / 10.0f
    }
}
```

---

## 8. Bilingual Khmer and English Dental Localization Reference

STRICT PROTOCOL ENFORCEMENT: ZERO emojis across all strings, and ZERO parentheses in any Khmer language text strings.

```
+--------------------------------------+--------------------------------------------------------------+
| English Dental Terminology           | Khmer Translation - Strictly Zero Parentheses                |
+--------------------------------------+--------------------------------------------------------------+
| FDI World Dental Federation Notation | ប្រព័ន្ធកត់ត្រាលេខធ្មេញអន្តរជាតិ FDI                          |
| Permanent Adult Dentition            | ធ្មេញព្រុកមនុស្សពេញវ័យ ៣២ គ្រាប់                               |
| Primary Deciduous Dentition          | ធ្មេញទឹកដោះកុមារ ២០ គ្រាប់                                   |
| Occlusal and Incisal Surface         | ផ្ទៃទំពារនិងគែមមុខកាត់ធ្មេញ                                  |
| Mesial Surface Towards Midline       | ផ្ទៃខាងក្នុងធ្មេញបែរទៅខ្សែបន្ទាត់កណ្តាល                      |
| Distal Surface Posterior             | ផ្ទៃខាងក្រោយធ្មេញបែរចេញពីខ្សែបន្ទាត់កណ្តាល                  |
| Buccal and Facial Surface            | ផ្ទៃធ្មេញខាងក្រៅបែរទៅថ្ពាល់និងបបូរមាត់                      |
| Lingual and Palatal Surface          | ផ្ទៃធ្មេញខាងក្នុងបែរទៅអណ្តាតនិងក្រអូមមាត់                     |
| Sound and Healthy Tooth              | ធ្មេញមានសុខភាពល្អធម្មតា                                      |
| Dental Caries and Active Cavitation  | ជំងឺពុកធ្មេញនិងប្រហោងធ្មេញសកម្ម                              |
| Existing Amalgam Restoration         | ស្នាមប៉ះធ្មេញចាស់ដោយលោហធាតុអាម៉ាល់ហ្គាម                      |
| Existing Composite Restoration       | ស្នាមប៉ះធ្មេញចាស់ដោយសារធាតុពណ៌ដូចធ្មេញកំប៉ូស៊ីត              |
| Porcelain or Zirconia Crown          | ការស្រោបធ្មេញដោយសេរ៉ាមិចឬហ្សៀកូនីញ៉ា                         |
| Endodontic Root Canal Treated        | ធ្មេញដែលបានព្យាបាលរន្ធឬសធ្មេញរួចរាល់                         |
| Missing Extracted Tooth              | ធ្មេញដែលបានដកចេញឬបាត់បង់                                     |
| Impacted Unerupted Tooth             | ធ្មេញកប់ក្នុងឆ្អឹងថ្គាម                                      |
| Dental Implant Fixture               | បង្គោលធ្មេញសិប្បនិម្មិតក្នុងឆ្អឹង អ៊ីមផ្លាន                   |
| Fixed Dental Bridge Pontic           | ធ្មេញស្ពានភ្ជាប់សិប្បនិម្មិត                                  |
| Periodontal Pocket Probing Depth     | ជម្រៅរណ្តៅអញ្ចាញធ្មេញគិតជាមីលីម៉ែត្រ                         |
| Bleeding on Probing BOP              | ការហូរឈាមពេលវាស់អញ្ចាញធ្មេញ                                  |
| Glickman Furcation Involvement       | ការស្រុតឆ្អឹងប្រហោងឬសធ្មេញហ្គ្លីកម៉ាន់                       |
| Miller Tooth Mobility Classification | ចំណាត់ថ្នាក់ធ្មេញរលុងមីលើ                                     |
| WHO DMFT Oral Epidemiological Index  | សន្ទស្សន៍សុខភាពធ្មេញពិភពលោក DMFT                             |
+--------------------------------------+--------------------------------------------------------------+
```

---

## 9. Safety and Clinical Audit Gates

```
+----------------------------------------+---------------------+---------------------------------------------------------+
| Safety Gate Check                      | Enforcement Level   | System Interlock Behavior                               |
+----------------------------------------+---------------------+---------------------------------------------------------+
| Extraction of Sound Tooth Guard        | Mandatory Warning   | Prompts double-confirmation if user marks a sound tooth |
|                                        |                     | for extraction without documented orthodontic order.    |
|                                        |                     |                                                         |
| Severe Periodontitis Deep Pocket Alert | Clinical Interlock  | Probing depths >= 6 mm automatically flag tooth for     |
|                                        |                     | radiographic bone loss evaluation before restorations.  |
|                                        |                     |                                                         |
| Pediatric Primary/Permanent Interlock  | Chronologic Guard   | Disallows deciduous tooth entry (51-85) on patients     |
|                                        |                     | older than 14 years without retained tooth override.    |
|                                        |                     |                                                         |
| NSSF Dental Procedure Cross-Check      | Financial Interlock | Automatically validates tooth FDI number against        |
|                                        |                     | NSSF allowed tooth types (e.g. molar vs incisor).       |
|                                        |                     |                                                         |
| Zero Emojis Compliance                 | Zero Tolerance      | Automated validation confirms 0 emoji symbols.          |
|                                        |                     |                                                         |
| Zero Parentheses in Khmer Text         | Zero Tolerance      | Automated validation confirms 0 parentheses on lines    |
|                                        |                     | containing Khmer characters.                            |
+----------------------------------------+---------------------+---------------------------------------------------------+
```
