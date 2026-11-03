package com.krupet.clinic.presentation.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.krupet.mobile.data.local.KruPetDatabase
import com.krupet.mobile.data.local.entity.EncounterEntity
import com.krupet.mobile.data.local.entity.VitalEntity
import com.krupet.mobile.data.repository.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.util.UUID
import kotlin.math.roundToInt

enum class ProductionEsiLevel(
    val levelNumber: Int,
    val titleEn: String,
    val titleKh: String,
    val maxWaitMinutes: Int,
    val careZone: String
) {
    ESI_1(1, "ESI 1 - Resuscitation", "កម្រិត ១ - សង្គ្រោះបន្ទាន់ជាបន្ទាន់", 0, "Trauma Suite"),
    ESI_2(2, "ESI 2 - Emergent", "កម្រិត ២ - សង្គ្រោះបន្ទាន់កម្រិតខ្ពស់", 10, "Acute Monitored Bed"),
    ESI_3(3, "ESI 3 - Urgent", "កម្រិត ៣ - បន្ទាន់មធ្យម", 30, "Main ED Cubicle"),
    ESI_4(4, "ESI 4 - Less Urgent", "កម្រិត ៤ - មិនសូវបន្ទាន់", 60, "Fast Track"),
    ESI_5(5, "ESI 5 - Non-Urgent", "កម្រិត ៥ - មិនបន្ទាន់", 120, "Outpatient Clinic")
}

enum class ProductionResourceRequirement {
    NONE,
    ONE,
    MULTIPLE
}

data class ProductionTriageUiState(
    val patientId: String = "patient_demo_01",
    val encounterId: String? = null,
    val patientName: String = "Prak Sambath - ប្រាក់ សម្បត្តិ",
    val patientCode: String = "HN-2026-1104",

    // Step 1: Immediate life-saving intervention
    val requiresLifeSavingIntervention: Boolean = false,
    // Step 2: High risk / acute distress
    val isHighRiskOrSevereDistress: Boolean = false,
    // Step 3: Diagnostic resources
    val resourceRequirement: ProductionResourceRequirement = ProductionResourceRequirement.MULTIPLE,

    // Vital signs inputs
    val heartRateInput: String = "86",
    val systolicBpInput: String = "124",
    val diastolicBpInput: String = "82",
    val respirationRateInput: String = "18",
    val spO2Input: String = "98",
    val temperatureInput: String = "36.8",
    val isSupplementalOxygen: Boolean = false,

    // GCS components
    val gcsEye: Int = 4,
    val gcsVerbal: Int = 5,
    val gcsMotor: Int = 6,

    // Persistence state
    val isSaving: Boolean = false,
    val savedSuccessMessage: String? = null,
    val errorMessage: String? = null
) {
    val totalGcs: Int get() = gcsEye + gcsVerbal + gcsMotor

    val heartRate: Int get() = heartRateInput.toIntOrNull() ?: 86
    val systolicBp: Int get() = systolicBpInput.toIntOrNull() ?: 124
    val diastolicBp: Int get() = diastolicBpInput.toIntOrNull() ?: 82
    val respirationRate: Int get() = respirationRateInput.toIntOrNull() ?: 18
    val spO2: Int get() = spO2Input.toIntOrNull() ?: 98
    val temperature: Double get() = temperatureInput.toDoubleOrNull() ?: 36.8

    // Vital signs danger zone thresholds
    val isHrDanger: Boolean get() = heartRate > 100 || heartRate < 50
    val isRrDanger: Boolean get() = respirationRate > 24 || respirationRate < 10
    val isSpO2Danger: Boolean get() = spO2 < 92
    val isSbpDanger: Boolean get() = systolicBp < 90

    val hasAnyDangerZoneVital: Boolean
        get() = isHrDanger || isRrDanger || isSpO2Danger || isSbpDanger

    // Shock Index: HR / SBP
    val shockIndex: Double
        get() = if (systolicBp > 0) {
            val raw = heartRate.toDouble() / systolicBp.toDouble()
            (raw * 100.0).roundToInt() / 100.0
        } else 0.0

    val isSevereShock: Boolean get() = shockIndex >= 0.9

    // ESI Calculation Engine
    val calculatedEsi: ProductionEsiLevel
        get() = when {
            requiresLifeSavingIntervention -> ProductionEsiLevel.ESI_1
            isHighRiskOrSevereDistress -> ProductionEsiLevel.ESI_2
            resourceRequirement == ProductionResourceRequirement.NONE -> ProductionEsiLevel.ESI_5
            resourceRequirement == ProductionResourceRequirement.ONE -> ProductionEsiLevel.ESI_4
            hasAnyDangerZoneVital -> ProductionEsiLevel.ESI_2 // Escalation rule
            else -> ProductionEsiLevel.ESI_3
        }

    val isEscalatedDueToVitals: Boolean
        get() = !requiresLifeSavingIntervention &&
                !isHighRiskOrSevereDistress &&
                resourceRequirement == ProductionResourceRequirement.MULTIPLE &&
                hasAnyDangerZoneVital

    // NEWS2 Score
    val news2Score: Int
        get() {
            var score = 0
            score += when {
                respirationRate <= 8 -> 3
                respirationRate in 9..11 -> 1
                respirationRate in 12..20 -> 0
                respirationRate in 21..24 -> 2
                else -> 3
            }
            score += when {
                spO2 <= 91 -> 3
                spO2 in 92..93 -> 2
                spO2 in 94..95 -> 1
                else -> 0
            }
            if (isSupplementalOxygen) score += 2
            score += when {
                systolicBp <= 90 -> 3
                systolicBp in 91..100 -> 2
                systolicBp in 101..110 -> 1
                systolicBp in 111..219 -> 0
                else -> 3
            }
            score += when {
                heartRate <= 40 -> 3
                heartRate in 41..50 -> 1
                heartRate in 51..90 -> 0
                heartRate in 91..110 -> 1
                heartRate in 111..130 -> 2
                else -> 3
            }
            if (totalGcs < 15) score += 3
            score += when {
                temperature <= 35.0 -> 3
                temperature in 35.1..36.0 -> 1
                temperature in 36.1..38.0 -> 0
                temperature in 38.1..39.0 -> 1
                else -> 2
            }
            return score
        }
}

class TriageViewModel(
    application: Application,
    private val vitalRepository: VitalRepository = OfflineFirstVitalRepository(
        vitalDao = KruPetDatabase.getInstance(application).vitalDao(),
        syncQueueDao = KruPetDatabase.getInstance(application).syncQueueDao()
    ),
    private val encounterRepository: EncounterRepository = OfflineFirstEncounterRepository(
        encounterDao = KruPetDatabase.getInstance(application).encounterDao(),
        syncQueueDao = KruPetDatabase.getInstance(application).syncQueueDao()
    ),
    private val patientRepository: PatientRepository = OfflineFirstPatientRepository(
        patientDao = KruPetDatabase.getInstance(application).patientDao(),
        syncQueueDao = KruPetDatabase.getInstance(application).syncQueueDao()
    )
) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(ProductionTriageUiState())
    val uiState: StateFlow<ProductionTriageUiState> = _uiState.asStateFlow()

    fun setRequiresLifeSaving(value: Boolean) {
        _uiState.update { it.copy(requiresLifeSavingIntervention = value) }
    }

    fun setHighRiskOrSevereDistress(value: Boolean) {
        _uiState.update { it.copy(isHighRiskOrSevereDistress = value) }
    }

    fun setResourceRequirement(value: ProductionResourceRequirement) {
        _uiState.update { it.copy(resourceRequirement = value) }
    }

    fun updateHeartRate(value: String) {
        _uiState.update { it.copy(heartRateInput = value) }
    }

    fun updateSystolicBp(value: String) {
        _uiState.update { it.copy(systolicBpInput = value) }
    }

    fun updateDiastolicBp(value: String) {
        _uiState.update { it.copy(diastolicBpInput = value) }
    }

    fun updateRespirationRate(value: String) {
        _uiState.update { it.copy(respirationRateInput = value) }
    }

    fun updateSpO2(value: String) {
        _uiState.update { it.copy(spO2Input = value) }
    }

    fun updateTemperature(value: String) {
        _uiState.update { it.copy(temperatureInput = value) }
    }

    fun setSupplementalOxygen(value: Boolean) {
        _uiState.update { it.copy(isSupplementalOxygen = value) }
    }

    fun updateGcsEye(delta: Int) {
        _uiState.update {
            val newVal = (it.gcsEye + delta).coerceIn(1, 4)
            it.copy(gcsEye = newVal)
        }
    }

    fun updateGcsVerbal(delta: Int) {
        _uiState.update {
            val newVal = (it.gcsVerbal + delta).coerceIn(1, 5)
            it.copy(gcsVerbal = newVal)
        }
    }

    fun updateGcsMotor(delta: Int) {
        _uiState.update {
            val newVal = (it.gcsMotor + delta).coerceIn(1, 6)
            it.copy(gcsMotor = newVal)
        }
    }

    fun persistTriageAssessment(patientIdOverride: String? = null) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true) }
            val state = _uiState.value
            val targetPatientId = patientIdOverride ?: state.patientId
            val vitalId = UUID.randomUUID().toString()
            val encounterId = state.encounterId ?: UUID.randomUUID().toString()

            val vitalEntity = VitalEntity(
                id = vitalId,
                patientId = targetPatientId,
                encounterId = encounterId,
                heartRateBpm = state.heartRate,
                systolicBpMmHg = state.systolicBp,
                diastolicBpMmHg = state.diastolicBp,
                respirationRateBpm = state.respirationRate,
                spO2Percent = state.spO2,
                temperatureCelsius = state.temperature,
                gcsScore = state.totalGcs,
                shockIndex = state.shockIndex,
                news2Score = state.news2Score,
                isSupplementalOxygen = state.isSupplementalOxygen,
                recordedAt = System.currentTimeMillis(),
                isSynced = false,
                createdAt = System.currentTimeMillis()
            )

            val vitalResult = vitalRepository.recordVitals(vitalEntity)

            if (vitalResult.isSuccess) {
                // Also create or update encounter
                val encounterEntity = EncounterEntity(
                    id = encounterId,
                    patientId = targetPatientId,
                    encounterType = "EMERGENCY",
                    department = "ER",
                    chiefComplaint = "Acute triage presentation",
                    triageAcuityLevel = state.calculatedEsi.name,
                    clinicalNotes = "NEWS2 score: ${state.news2Score}, Shock Index: ${state.shockIndex}, GCS: ${state.totalGcs}",
                    status = "ACTIVE",
                    startedAt = System.currentTimeMillis(),
                    isSynced = false,
                    createdAt = System.currentTimeMillis(),
                    updatedAt = System.currentTimeMillis()
                )
                encounterRepository.startEncounter(encounterEntity)

                _uiState.update {
                    it.copy(
                        isSaving = false,
                        encounterId = encounterId,
                        savedSuccessMessage = "ការវាយតម្លៃសង្គ្រោះបន្ទាន់ត្រូវបានរក្សាទុកក្នុងប្រព័ន្ធ Room ជោគជ័យ: ${state.calculatedEsi.name}",
                        errorMessage = null
                    )
                }
            } else {
                val err = vitalResult.exceptionOrNull()?.message ?: "Failed to persist vitals"
                _uiState.update {
                    it.copy(
                        isSaving = false,
                        errorMessage = err
                    )
                }
            }
        }
    }

    fun resetTriage() {
        _uiState.value = ProductionTriageUiState()
    }

    fun clearFeedback() {
        _uiState.update {
            it.copy(
                savedSuccessMessage = null,
                errorMessage = null
            )
        }
    }
}
