package com.krupet.clinic

import android.app.Application
import androidx.work.Configuration
import com.krupet.mobile.sync.SyncWorker

class KruPetApplication : Application(), Configuration.Provider {

    override fun onCreate() {
        super.onCreate()
        instance = this
        try {
            SyncWorker.schedulePeriodicSync(this)
        } catch (_: Throwable) {
            // Guard against test runner initialization edge cases
        }
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()

    companion object {
        lateinit var instance: KruPetApplication
            private set
    }
}
