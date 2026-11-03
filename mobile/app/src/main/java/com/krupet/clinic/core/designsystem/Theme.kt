package com.krupet.clinic.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Medical Clean Color Palette - Pristine Clinical Slate & Deep Teal
val MedicalDeepTeal = Color(0xFF006A6A)
val MedicalLightTeal = Color(0xFF6FF7F5)
val MedicalSlate = Color(0xFF4A6362)
val MedicalBackground = Color(0xFFFAFDFB)
val MedicalSurface = Color(0xFFFFFFFF)
val MedicalSurfaceVariant = Color(0xFFDAE5E3)
val MedicalOnSurface = Color(0xFF191C1C)
val MedicalError = Color(0xFFBA1A1A)
val MedicalBorder = Color(0xFFE0E7E6)

// Official Bank & Payment Colors (Cambodia National Gateway)
val BankBakongRed = Color(0xFFE21A1A)
val BankAbaNavy = Color(0xFF055E7C)
val BankAcledaBlue = Color(0xFF0C3D60)
val BankWingGreen = Color(0xFF75B832)
val BankKhqrDarkBlue = Color(0xFF055E7C)

// Emergency Acuity Tier Colors
val AcuityEsi1Resus = Color(0xFFD32F2F)
val AcuityEsi2Emergent = Color(0xFFE65100)
val AcuityEsi3Urgent = Color(0xFFF57F17)
val AcuityEsi4LessUrgent = Color(0xFF388E3C)
val AcuityEsi5NonUrgent = Color(0xFF1976D2)

private val LightColorScheme = lightColorScheme(
    primary = MedicalDeepTeal,
    onPrimary = Color.White,
    primaryContainer = MedicalLightTeal,
    onPrimaryContainer = Color(0xFF002020),
    secondary = MedicalSlate,
    onSecondary = Color.White,
    background = MedicalBackground,
    onBackground = MedicalOnSurface,
    surface = MedicalSurface,
    onSurface = MedicalOnSurface,
    surfaceVariant = MedicalSurfaceVariant,
    onSurfaceVariant = Color(0xFF3F4948),
    error = MedicalError,
    onError = Color.White
)

val ClinicalTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        color = MedicalOnSurface
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        color = MedicalOnSurface
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp,
        color = MedicalOnSurface
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 15.sp,
        lineHeight = 20.sp,
        color = MedicalOnSurface
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        color = MedicalOnSurface
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp,
        color = Color(0xFF3F4948)
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp,
        color = Color(0xFF6F7978)
    )
)

@Composable
fun KruPetTheme(
    content: @Composable () -> Unit
) {
    // Strictly Clinical Clean Light Scheme - Standardized for Medical Environments
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = ClinicalTypography,
        content = content
    )
}
