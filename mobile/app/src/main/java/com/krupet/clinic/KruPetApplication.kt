package com.krupet.clinic

import android.app.Application

class KruPetApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: KruPetApplication
            private set
    }
}
