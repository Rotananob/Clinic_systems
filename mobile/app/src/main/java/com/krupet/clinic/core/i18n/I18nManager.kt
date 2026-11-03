package com.krupet.clinic.core.i18n

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

enum class AppLanguage(val code: String, val displayNameKh: String, val displayNameEn: String) {
    KHMER("km", "ខ្មែរ", "Khmer"),
    ENGLISH("en", "English", "English")
}

object I18nManager {
    var currentLanguage by mutableStateOf(AppLanguage.KHMER)

    fun toggleLanguage() {
        currentLanguage = if (currentLanguage == AppLanguage.KHMER) AppLanguage.ENGLISH else AppLanguage.KHMER
    }

    fun isKhmer(): Boolean = currentLanguage == AppLanguage.KHMER

    // Core String Lookups
    fun get(key: String): String {
        val isKm = isKhmer()
        return when (key) {
            "app_title" -> if (isKm) "មន្ទីរពេទ្យ គ្រូពេទ្យ - KruPet Enterprise" else "KruPet Hospital Enterprise"
            "hospital_name" -> if (isKm) "មន្ទីរពេទ្យ គ្រូពេទ្យ" else "KruPet Hospital"
            "branch_name" -> if (isKm) "សាខាកណ្តាល រាជធានីភ្នំពេញ" else "Phnom Penh Central Branch"
            "triage_title" -> if (isKm) "ប្រព័ន្ធវាយតម្លៃបន្ទាន់ Triage ESI v4" else "Emergency Triage ESI v4 & NEWS2"
            "ward_title" -> if (isKm) "គ្រប់គ្រងគ្រែសម្រាកពេទ្យ Ward Bed Census" else "Inpatient Ward Bed Census & SBAR"
            "telemetry_title" -> if (isKm) "តាមដានរលកបេះដូង Bedside ECG" else "Bedside ECG Telemetry & Vitals"
            "bakong_pos_title" -> if (isKm) "ទូទាត់ប្រាក់ Bakong KHQR POS" else "Bakong KHQR Dual-Currency POS"
            "explore_tools" -> if (isKm) "រុករកឧបករណ៍គ្លីនិក" else "Explore Clinical Tools"
            "pricing_plans" -> if (isKm) "គម្រោងសេវាកម្ម SaaS" else "SaaS Subscription Plans"
            "cloud_paas" -> if (isKm) "ហេដ្ឋារចនាសម្ព័ន្ធ Cloud PaaS" else "Healthcare Platform as a Service"
            "settings_ota" -> if (isKm) "ការកំណត់ និងអាប់ដេត" else "Settings & System OTA"
            "auto_update" -> if (isKm) "ទាញយកកំណែថ្មីស្វ័យប្រវត្តិតាម Wi-Fi" else "Auto-download updates over Wi-Fi"
            "check_updates" -> if (isKm) "ពិនិត្យមើលកំណែថ្មី" else "Check for Updates"
            "up_to_date" -> if (isKm) "កម្មវិធីជាកំណែចុងក្រោយបំផុត" else "Application is up to date"
            "current_plan" -> if (isKm) "គម្រោងបច្ចុប្បន្ន" else "Current Plan"
            "upgrade_action" -> if (isKm) "ដំឡើងឥឡូវនេះ" else "Upgrade with Bakong KHQR"
            "locked_badge" -> if (isKm) "ចាក់សោ - តម្រូវឱ្យមាន" else "Locked - Requires"
            "unlocked_badge" -> if (isKm) "បានបើកដំណើរការ" else "Active & Unlocked"
            else -> key
        }
    }
}
