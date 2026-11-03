package com.krupet.clinic.presentation.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.krupet.clinic.core.network.ConnectivityObserver
import com.krupet.clinic.core.network.ConnectivityStatus
import com.krupet.clinic.core.network.NetworkConnectivityObserver
import com.krupet.mobile.data.local.KruPetDatabase
import com.krupet.mobile.sync.SyncWorker
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class PanicLabAlert(
    val id: String,
    val patientCode: String,
    val patientName: String,
    val testNameEn: String,
    val testNameKh: String,
    val value: String,
    val normalRange: String,
    val severity: String,
    val timestamp: String
)

data class DashboardUiState(
    val inpatientCount: Int = 18,
    val triageQueueCount: Int = 7,
    val activeEmergencyCount: Int = 3,
    val panicLabAlertsCount: Int = 2,
    val panicLabAlerts: List<PanicLabAlert> = listOf(
        PanicLabAlert(
            id = "alert_1",
            patientCode = "HN-2026-0882",
            patientName = "Chan Sokha - ចាន់ សុខា",
            testNameEn = "Serum Potassium",
            testNameKh = "ប៉ូតាស្យូមក្នុងឈាម",
            value = "6.4 mmol/L",
            normalRange = "3.5 - 5.0 mmol/L",
            severity = "CRITICAL HIGH",
            timestamp = "10 mins ago"
        ),
        PanicLabAlert(
            id = "alert_2",
            patientCode = "HN-2026-1104",
            patientName = "Prak Sambath - ប្រាក់ សម្បត្តិ",
            testNameEn = "Venous Blood Lactate",
            testNameKh = "ឡាក់តាតក្នុងឈាម",
            value = "4.2 mmol/L",
            normalRange = "0.5 - 2.0 mmol/L",
            severity = "CRITICAL HIGH",
            timestamp = "22 mins ago"
        )
    ),
    val connectivityStatus: ConnectivityStatus = ConnectivityStatus.AVAILABLE,
    val pendingSyncCount: Int = 0,
    val isSyncing: Boolean = false,
    val lastSyncTimestamp: Long = System.currentTimeMillis()
)

class DashboardViewModel(
    application: Application,
    private val connectivityObserver: ConnectivityObserver = NetworkConnectivityObserver(application),
    private val database: KruPetDatabase = KruPetDatabase.getInstance(application)
) : AndroidViewModel(application) {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        observeNetwork()
        observeDatabaseCounts()
    }

    private fun observeNetwork() {
        viewModelScope.launch {
            connectivityObserver.observe().collect { status ->
                _uiState.update { it.copy(connectivityStatus = status) }
            }
        }
    }

    private fun observeDatabaseCounts() {
        viewModelScope.launch {
            database.syncQueueDao().getPendingCount().collect { count ->
                _uiState.update { it.copy(pendingSyncCount = count) }
            }
        }

        viewModelScope.launch {
            database.encounterDao().getActiveEncounters().collect { activeEncounters ->
                val erCount = activeEncounters.count { it.department.equals("ER", ignoreCase = true) }
                val inpatientCount = activeEncounters.count { it.encounterType.equals("INPATIENT", ignoreCase = true) }

                _uiState.update { state ->
                    state.copy(
                        activeEmergencyCount = erCount.coerceAtLeast(1),
                        inpatientCount = inpatientCount.coerceAtLeast(1)
                    )
                }
            }
        }
    }

    fun triggerManualSync() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true) }
            SyncWorker.enqueueImmediateSync(getApplication())
            // Simulate short completion delay
            kotlinx.coroutines.delay(1000L)
            _uiState.update {
                it.copy(
                    isSyncing = false,
                    lastSyncTimestamp = System.currentTimeMillis()
                )
            }
        }
    }

    fun acknowledgePanicAlert(alertId: String) {
        _uiState.update { state ->
            val updated = state.panicLabAlerts.filterNot { it.id == alertId }
            state.copy(
                panicLabAlerts = updated,
                panicLabAlertsCount = updated.size
            )
        }
    }
}
