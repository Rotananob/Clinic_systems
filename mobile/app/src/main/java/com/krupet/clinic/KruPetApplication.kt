package com.krupet.clinic

import android.app.Application
import com.krupet.mobile.sync.SyncWorker

class KruPetApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
        SyncWorker.schedulePeriodicSync(this)
    }

    companion object {
        lateinit var instance: KruPetApplication
            private set
    }
}
