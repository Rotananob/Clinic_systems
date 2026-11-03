package com.krupet.clinic.core.search

enum class SearchCategory(val titleKh: String, val titleEn: String) {
    PATIENT("អ្នកជំងឺ", "Patient"),
    ICD10("រោគវិនិច្ឆ័យ ICD-10", "Diagnosis ICD-10"),
    MEDICATION("ឱសថ និងថ្នាំ ISMP", "Medication ISMP"),
    CLINICAL_MODULE("ផ្នែកគ្លីនិក", "Clinical Module")
}

sealed class ClinicalSearchResult(
    open val id: String,
    open val title: String,
    open val subtitle: String,
    open val category: SearchCategory,
    open val deepLinkUri: String,
    open val relevanceScore: Int
) {
    data class PatientHit(
        override val id: String,
        val hn: String,
        val nameEn: String,
        val nameKh: String,
        val bedNumber: String,
        val primaryDiagnosis: String,
        val hasSevereAllergy: Boolean,
        override val deepLinkUri: String = "krupet://patient/$hn",
        override val relevanceScore: Int
    ) : ClinicalSearchResult(
        id = id,
        title = "$nameKh - $nameEn",
        subtitle = "HN: $hn - $bedNumber - $primaryDiagnosis",
        category = SearchCategory.PATIENT,
        deepLinkUri = deepLinkUri,
        relevanceScore = relevanceScore
    )

    data class Icd10Hit(
        override val id: String,
        val code: String,
        val descriptionEn: String,
        val descriptionKh: String,
        val isOccupationalTrauma: Boolean,
        override val deepLinkUri: String = "krupet://icd10/$code",
        override val relevanceScore: Int
    ) : ClinicalSearchResult(
        id = id,
        title = "$code: $descriptionEn",
        subtitle = "$descriptionKh - MoH NSSF Verified",
        category = SearchCategory.ICD10,
        deepLinkUri = deepLinkUri,
        relevanceScore = relevanceScore
    )

    data class MedicationHit(
        override val id: String,
        val genericName: String,
        val brandName: String,
        val standardDosage: String,
        val isIsmpHighAlert: Boolean,
        val whoAwareCategory: String, // ACCESS, WATCH, RESERVE
        override val deepLinkUri: String = "krupet://medication/$id",
        override val relevanceScore: Int
    ) : ClinicalSearchResult(
        id = id,
        title = "$genericName - $brandName",
        subtitle = "$standardDosage - WHO $whoAwareCategory - ISMP: ${if (isIsmpHighAlert) "HIGH ALERT DUAL WITNESS" else "STANDARD"}",
        category = SearchCategory.MEDICATION,
        deepLinkUri = deepLinkUri,
        relevanceScore = relevanceScore
    )

    data class ModuleHit(
        override val id: String,
        val moduleRoute: String,
        val moduleNameKh: String,
        val moduleNameEn: String,
        val description: String,
        override val deepLinkUri: String = "krupet://route/$moduleRoute",
        override val relevanceScore: Int
    ) : ClinicalSearchResult(
        id = id,
        title = "$moduleNameKh - $moduleNameEn",
        subtitle = description,
        category = SearchCategory.CLINICAL_MODULE,
        deepLinkUri = deepLinkUri,
        relevanceScore = relevanceScore
    )
}

object FastClinicalSearchEngine {

    private val patientCatalog = listOf(
        ClinicalSearchResult.PatientHit(
            id = "p1",
            hn = "HN-10492",
            nameEn = "Sokha Rath",
            nameKh = "រ័ត្ន សុខា",
            bedNumber = "Bed 01 ICU",
            primaryDiagnosis = "Acute Appendicitis Post-Op Day 1",
            hasSevereAllergy = true,
            relevanceScore = 0
        ),
        ClinicalSearchResult.PatientHit(
            id = "p2",
            hn = "HN-10501",
            nameEn = "Bopha Chann",
            nameKh = "ចាន់ បុប្ផា",
            bedNumber = "Bed 04 ICU",
            primaryDiagnosis = "Dengue Hemorrhagic Fever Grade 2 Shock Index 1.22",
            hasSevereAllergy = false,
            relevanceScore = 0
        ),
        ClinicalSearchResult.PatientHit(
            id = "p3",
            hn = "HN-10515",
            nameEn = "Dara Khem",
            nameKh = "ខឹម ដារ៉ា",
            bedNumber = "Bed 07 ER",
            primaryDiagnosis = "NSTEMI on IV Heparin Protocol - Troponin 4.8 ng/mL",
            hasSevereAllergy = false,
            relevanceScore = 0
        ),
        ClinicalSearchResult.PatientHit(
            id = "p4",
            hn = "HN-10522",
            nameEn = "Vanna Seng",
            nameKh = "សេង វណ្ណា",
            bedNumber = "Bed 12 Ward",
            primaryDiagnosis = "Community Acquired Pneumonia CURB-65 Score 2",
            hasSevereAllergy = true,
            relevanceScore = 0
        )
    )

    private val icd10Catalog = listOf(
        ClinicalSearchResult.Icd10Hit("icd_1", "K35.80", "Unspecified acute appendicitis", "រលាកខ្នែងពោះវៀនស្រួចស្រាវ", false, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_2", "A91", "Dengue hemorrhagic fever", "ជំងឺគ្រុនឈាមដង់ហ្គាធ្ងន់ធ្ងរ", false, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_3", "I21.4", "Non-ST elevation myocardial infarction", "ជំងឺគាំងបេះដូងប្រភេទ NSTEMI", false, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_4", "J18.9", "Pneumonia unspecified organism", "ជំងឺរលាកសួតស្រួចស្រាវ", false, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_5", "S06.0", "Concussion with loss of consciousness", "ប៉ះទង្គិចខួរក្បាលដោយគ្រោះថ្នាក់", true, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_6", "S52.5", "Fracture of lower end of radius", "បាក់ឆ្អឹងកដៃទាក់ទងនឹងការងារ", true, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_7", "C50.9", "Malignant neoplasm of breast unspecified", "ដុំសាច់មហារីកសុដន់", false, relevanceScore = 0),
        ClinicalSearchResult.Icd10Hit("icd_8", "K02.9", "Dental caries unspecified", "ជំងឺពុកធ្មេញ", false, relevanceScore = 0)
    )

    private val medicationCatalog = listOf(
        ClinicalSearchResult.MedicationHit("med_1", "Ceftriaxone", "Rocephin", "1g to 2g IV q24h", false, "WATCH", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_2", "Meropenem", "Merrem", "1g IV q8h extended infusion", true, "RESERVE", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_3", "Vancomycin", "Vancocin", "15 to 20 mg/kg IV q12h AUC guided", true, "RESERVE", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_4", "Heparin Sodium", "Liquaemin", "5000 units IV bolus then 18 units/kg/hr", true, "ACCESS", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_5", "Regular Insulin", "Humulin R", "0.1 unit/kg/hr IV infusion titration", true, "ACCESS", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_6", "Morphine Sulfate", "Duramorph", "2mg to 5mg IV q4h PRN", true, "WATCH", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_7", "Carboplatin", "Paraplatin", "AUC 5 to 6 Calvert IV infusion", true, "RESERVE", relevanceScore = 0),
        ClinicalSearchResult.MedicationHit("med_8", "Amoxicillin-Clavulanate", "Augmentin", "1000/200mg IV q8h", false, "ACCESS", relevanceScore = 0)
    )

    private val moduleCatalog = listOf(
        ClinicalSearchResult.ModuleHit("mod_1", "triage", "សង្គ្រោះបន្ទាន់ Triage", "Emergency ESI v4", "Triage ESI algorithm, NEWS2 vital calculation, and Glasgow Coma Scale.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_2", "resus", "បន្ទប់សង្គ្រោះបេះដូង", "ACLS Resuscitation", "ACLS CPR metronome 110 BPM, ROSC protocol, and Parkland burn formula.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_3", "telemetry", "តាមដានរលកបេះដូង", "ECG Telemetry", "Bedside 60 FPS Canvas ECG, arrhythmia alerts, and IV infusion pump DSP.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_4", "ward", "គ្រែសម្រាកពេទ្យ", "Inpatient Bed Census", "Acuity ward beds: ICU, HDU, General, Isolation Negative Pressure, and eMAR BCMA.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_5", "pos", "ទូទាត់ប្រាក់ Bakong", "Bakong KHQR POS", "Bakong KHQR payment gateway, ABA Mobile Pay, and dual USD KHR engine.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_6", "pacs", "រូបភាពវេជ្ជសាស្ត្រ", "PACS Radiology DICOM", "Diagnostic DICOM viewer with Bone Soft Tissue Lung windowing, Cobb angle, and CTR.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_7", "dental", "ទន្តសាស្ត្រ FDI", "Dental Odontogram", "FDI 32 permanent and 20 primary tooth arch, periodontal pocket probing, and DMFT.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_8", "chemo", "មហារីក និងគីមីព្យាបាល", "Chemotherapy Station", "Calvert carboplatin dosing, Mosteller BSA, organ clearance stops, and extravasation.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_9", "pediatric", "កុមារ និងទារកទើបកើត", "Pediatric Nomograms", "Bhutani hyperbilirubinemia curve, pGCS, Broselow resuscitation ladder, and age vitals.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_10", "nssf", "ប.ស.ស កម្ពុជា", "Cambodia NSSF e-Claim", "CamDX 10-digit ID verification, K B R tariff calculation, and occupational risk.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_11", "narcotics", "ទូស្តុកថ្នាំញៀន", "Narcotics MoH Vault", "Dual-nurse biometric witness ledger and Merkle cryptographic audit chain.", relevanceScore = 0),
        ClinicalSearchResult.ModuleHit("mod_12", "stewardship", "គ្រប់គ្រងថ្នាំផ្សះ", "Antimicrobial Stewardship", "Cockcroft-Gault CrCl, Vancomycin 24-hour AUC, and WHO AWaRe restriction gates.", relevanceScore = 0)
    )

    fun search(rawQuery: String): List<ClinicalSearchResult> {
        val q = rawQuery.trim().lowercase()
        if (q.isEmpty()) return emptyList()

        val results = mutableListOf<ClinicalSearchResult>()

        // 1. Search Patients
        patientCatalog.forEach { p ->
            val score = scoreMatch(q, listOf(p.hn, p.nameEn, p.nameKh, p.bedNumber, p.primaryDiagnosis))
            if (score > 0) {
                results.add(p.copy(relevanceScore = score))
            }
        }

        // 2. Search ICD-10
        icd10Catalog.forEach { icd ->
            val score = scoreMatch(q, listOf(icd.code, icd.descriptionEn, icd.descriptionKh))
            if (score > 0) {
                results.add(icd.copy(relevanceScore = score))
            }
        }

        // 3. Search Medications
        medicationCatalog.forEach { med ->
            val score = scoreMatch(q, listOf(med.genericName, med.brandName, med.whoAwareCategory))
            if (score > 0) {
                results.add(med.copy(relevanceScore = score))
            }
        }

        // 4. Search Modules & Tools
        moduleCatalog.forEach { mod ->
            val score = scoreMatch(q, listOf(mod.moduleNameEn, mod.moduleNameKh, mod.moduleRoute, mod.description))
            if (score > 0) {
                results.add(mod.copy(relevanceScore = score))
            }
        }

        return results.sortedByDescending { it.relevanceScore }
    }

    private fun scoreMatch(query: String, fields: List<String>): Int {
        var highestScore = 0
        for (field in fields) {
            val f = field.lowercase()
            when {
                f == query -> highestScore = maxOf(highestScore, 100)
                f.startsWith(query) -> highestScore = maxOf(highestScore, 85)
                f.contains(query) -> highestScore = maxOf(highestScore, 65)
            }
        }
        return highestScore
    }
}
