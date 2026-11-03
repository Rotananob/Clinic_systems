package com.krupet.mobile.sync

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.krupet.mobile.data.local.KruPetDatabase
import com.krupet.mobile.data.repository.OfflineFirstEncounterRepository
import com.krupet.mobile.data.repository.OfflineFirstPatientRepository
import com.krupet.mobile.data.repository.OfflineFirstVitalRepository
import com.krupet.mobile.data.repository.OfflineSyncCoordinator
import java.util.concurrent.TimeUnit

class SyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val database = KruPetDatabase.getInstance(applicationContext)

            val patientRepository = OfflineFirstPatientRepository(
                patientDao = database.patientDao(),
                syncQueueDao = database.syncQueueDao()
            )
            val vitalRepository = OfflineFirstVitalRepository(
                vitalDao = database.vitalDao(),
                syncQueueDao = database.syncQueueDao()
            )
            val encounterRepository = OfflineFirstEncounterRepository(
                encounterDao = database.encounterDao(),
                syncQueueDao = database.syncQueueDao()
            )

            val syncCoordinator = OfflineSyncCoordinator(
                syncQueueDao = database.syncQueueDao(),
                patientRepository = patientRepository,
                vitalRepository = vitalRepository,
                encounterRepository = encounterRepository
            )

            val syncResult = syncCoordinator.executeSync()

            if (syncResult.failureCount == 0) {
                Result.success()
            } else {
                if (runAttemptCount < 3) {
                    Result.retry()
                } else {
                    Result.failure()
                }
            }
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }

    companion object {
        private const val PERIODIC_SYNC_WORK_NAME = "KruPetBackgroundSyncWorker"
        private const val IMMEDIATE_SYNC_WORK_NAME = "KruPetImmediateSyncWorker"

        fun schedulePeriodicSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .setRequiresBatteryNotLow(true)
                .build()

            val periodicRequest = PeriodicWorkRequestBuilder<SyncWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES // Flex interval
            )
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_SYNC_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                periodicRequest
            )
        }

        fun enqueueImmediateSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val immediateRequest = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_SYNC_WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                immediateRequest
            )
        }
    }
}
