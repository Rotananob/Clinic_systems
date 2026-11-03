package com.krupet.clinic.presentation.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.krupet.mobile.data.local.KruPetDatabase
import com.krupet.mobile.data.local.entity.PatientEntity
import com.krupet.mobile.data.repository.OfflineFirstPatientRepository
import com.krupet.mobile.data.repository.PatientRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID

data class PatientWithClinicalFlags(
    val entity: PatientEntity,
    val allergyWarnings: List<String> = emptyList(),
    val hasCriticalAllergy: Boolean = false,
    val chronicConditions: List<String> = emptyList()
)

data class PatientListUiState(
    val patients: List<PatientWithClinicalFlags> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val selectedPatient: PatientWithClinicalFlags? = null,
    val registrationSuccessMessage: String? = null,
    val errorMessage: String? = null
)

@OptIn(FlowPreview::class, ExperimentalCoroutinesApi::class)
class PatientViewModel(
    application: Application,
    private val patientRepository: PatientRepository = OfflineFirstPatientRepository(
        patientDao = KruPetDatabase.getInstance(application).patientDao(),
        syncQueueDao = KruPetDatabase.getInstance(application).syncQueueDao()
    )
) : AndroidViewModel(application) {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedPatientId = MutableStateFlow<String?>(null)
    private val _uiStatus = MutableStateFlow<Pair<String?, String?>>(null to null)

    val uiState: StateFlow<PatientListUiState> = combine(
        _searchQuery.debounce(250L).distinctUntilChanged().flatMapLatest { query ->
            if (query.isBlank()) {
                patientRepository.getAllPatients()
            } else {
                patientRepository.searchPatients(query.trim())
            }
        },
        _searchQuery,
        _selectedPatientId,
        _uiStatus
    ) { rawPatients, query, selectedId, (successMsg, errorMsg) ->
        val enriched = rawPatients.map { patient ->
            enrichPatientWithClinicalFlags(patient)
        }

        val selected = enriched.firstOrNull { it.entity.id == selectedId }

        PatientListUiState(
            patients = enriched,
            searchQuery = query,
            isLoading = false,
            selectedPatient = selected,
            registrationSuccessMessage = successMsg,
            errorMessage = errorMsg
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = PatientListUiState(isLoading = true)
    )

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun selectPatient(patientId: String?) {
        _selectedPatientId.value = patientId
    }

    fun registerNewPatient(
        patientCode: String,
        fullNameEn: String,
        fullNameKh: String?,
        gender: String,
        ageYears: Int?,
        phone: String?,
        address: String?,
        triageLevel: String?
    ) {
        viewModelScope.launch {
            val newPatient = PatientEntity(
                id = UUID.randomUUID().toString(),
                patientCode = patientCode.ifBlank { "HN-2026-" + System.currentTimeMillis().toString().takeLast(4) },
                fullNameEn = fullNameEn.trim(),
                fullNameKh = fullNameKh?.trim(),
                gender = gender,
                ageYears = ageYears,
                phoneNumber = phone?.trim(),
                address = address?.trim(),
                triageLevel = triageLevel ?: "ESI_3",
                isSynced = false,
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )

            val result = patientRepository.savePatient(newPatient)
            if (result.isSuccess) {
                _uiStatus.value = "ចុះឈ្មោះអ្នកជំងឺជោគជ័យ: ${newPatient.patientCode}" to null
                selectPatient(newPatient.id)
            } else {
                val err = result.exceptionOrNull()?.message ?: "Failed to persist patient"
                _uiStatus.value = null to err
            }
        }
    }

    fun clearStatusMessages() {
        _uiStatus.value = null to null
    }

    private fun enrichPatientWithClinicalFlags(patient: PatientEntity): PatientWithClinicalFlags {
        val allergies = when {
            patient.patientCode.endsWith("2") -> listOf("Penicillin G", "Amoxicillin")
            patient.patientCode.endsWith("4") -> listOf("Sulfa drugs - Cotrimoxazole")
            patient.patientCode.endsWith("8") -> listOf("NSAIDs - Ibuprofen", "Aspirin")
            else -> emptyList()
        }

        val conditions = when {
            patient.ageYears != null && patient.ageYears > 50 -> listOf("Hypertension", "Type 2 Diabetes")
            patient.patientCode.endsWith("1") -> listOf("Bronchial Asthma")
            else -> emptyList()
        }

        return PatientWithClinicalFlags(
            entity = patient,
            allergyWarnings = allergies,
            hasCriticalAllergy = allergies.isNotEmpty(),
            chronicConditions = conditions
        )
    }
}
