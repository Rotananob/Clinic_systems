package com.krupet.clinic.presentation.common

import android.media.AudioManager
import android.media.ToneGenerator
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentPaste
import androidx.compose.material.icons.filled.FlashOn
import androidx.compose.material.icons.filled.FlashlightOff
import androidx.compose.material.icons.filled.FlashlightOn
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.krupet.clinic.core.designsystem.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

sealed class ScanResult {
    data class PatientWristband(
        val hospitalNumber: String,
        val patientName: String,
        val rawCode: String
    ) : ScanResult()

    data class MedicationGs1(
        val gtin: String,
        val expiryDate: String,
        val isExpired: Boolean,
        val batchNumber: String,
        val serialNumber: String,
        val rawCode: String
    ) : ScanResult()

    data class GeneralCode(
        val codeType: String,
        val value: String
    ) : ScanResult()
}

object ClinicalBarcodeParser {

    fun parse(rawCode: String): ScanResult {
        val trimmed = rawCode.trim()

        // 1. Patient Wristband QR Parsing (Format: KRUPET:HN:XXXX:NAME:YYYY or HN:XXXX:NAME:YYYY)
        if (trimmed.startsWith("KRUPET:HN:", ignoreCase = true) || trimmed.startsWith("HN:", ignoreCase = true)) {
            val parts = trimmed.split(":")
            var hn = ""
            var name = ""

            for (i in parts.indices) {
                if (parts[i].equals("HN", ignoreCase = true) && i + 1 < parts.size) {
                    hn = parts[i + 1]
                }
                if (parts[i].equals("NAME", ignoreCase = true) && i + 1 < parts.size) {
                    name = parts[i + 1]
                }
            }

            if (hn.isNotBlank()) {
                return ScanResult.PatientWristband(
                    hospitalNumber = hn,
                    patientName = name.ifBlank { "Patient - $hn" },
                    rawCode = trimmed
                )
            }
        }

        // 2. GS1 DataMatrix Medication Barcode Parsing
        // Bracketed format: (01)GTIN(17)EXP(10)LOT(21)SN
        if (trimmed.contains("(01)") || (trimmed.startsWith("01") && trimmed.length >= 16)) {
            return parseGs1DataMatrix(trimmed)
        }

        // 3. Fallback General Code
        return ScanResult.GeneralCode(
            codeType = if (trimmed.length > 20) "2D DataMatrix / QR" else "1D Linear Barcode",
            value = trimmed
        )
    }

    private fun parseGs1DataMatrix(raw: String): ScanResult.MedicationGs1 {
        var gtin = ""
        var expiry = ""
        var batch = ""
        var serial = ""
        var isExpired = false

        if (raw.contains("(")) {
            // Bracketed AI notation
            val aiPattern = java.util.regex.Pattern.compile("\\((\\d{2})\\)([^()]+)")
            val matcher = aiPattern.matcher(raw)
            while (matcher.find()) {
                val ai = matcher.group(1) ?: ""
                val value = matcher.group(2) ?: ""
                when (ai) {
                    "01" -> gtin = value
                    "17" -> expiry = formatGs1Expiry(value)
                    "10" -> batch = value
                    "21" -> serial = value
                }
            }
        } else {
            // Raw unbracketed AI stream (01: 14 chars, 17: 6 chars, etc.)
            try {
                if (raw.startsWith("01") && raw.length >= 16) {
                    gtin = raw.substring(2, 16)
                    val remainder = raw.substring(16)
                    if (remainder.startsWith("17") && remainder.length >= 8) {
                        expiry = formatGs1Expiry(remainder.substring(2, 8))
                        val next = remainder.substring(8)
                        if (next.startsWith("10")) {
                            batch = next.substring(2)
                        }
                    }
                }
            } catch (e: Exception) {
                gtin = raw.take(14)
            }
        }

        // Evaluate expiration date
        if (expiry.isNotBlank()) {
            isExpired = checkIsExpired(expiry)
        }

        return ScanResult.MedicationGs1(
            gtin = gtin.ifBlank { "N/A" },
            expiryDate = expiry.ifBlank { "Not Specified" },
            isExpired = isExpired,
            batchNumber = batch.ifBlank { "N/A" },
            serialNumber = serial.ifBlank { "N/A" },
            rawCode = raw
        )
    }

    private fun formatGs1Expiry(rawSixDigits: String): String {
        return if (rawSixDigits.length == 6) {
            val yy = rawSixDigits.substring(0, 2)
            val mm = rawSixDigits.substring(2, 4)
            val dd = rawSixDigits.substring(4, 6)
            "20$yy-$mm-$dd"
        } else {
            rawSixDigits
        }
    }

    private fun checkIsExpired(expiryFormatted: String): Boolean {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val expiryDate = sdf.parse(expiryFormatted) ?: return false
            expiryDate.before(Date())
        } catch (e: Exception) {
            false
        }
    }
}

@Composable
fun BarcodeScannerModal(
    onDismiss: () -> Unit,
    onScanSuccess: (ScanResult) -> Unit,
    scannerTitle: String = "Clinical Barcode & Patient QR Scanner",
    scannerTitleKh: String = "ស្កេនបាកូដ និងកូដ QR វេជ្ជសាស្ត្រ"
) {
    val haptic = LocalHapticFeedback.current
    var isFlashlightOn by remember { mutableStateOf(false) }
    var manualInput by remember { mutableStateOf("") }
    var showManualInput by remember { mutableStateOf(false) }
    var decodedResult by remember { mutableStateOf<ScanResult?>(null) }

    fun playFeedbackAndEmit(result: ScanResult) {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        try {
            val toneGen = ToneGenerator(AudioManager.STREAM_NOTIFICATION, 80)
            toneGen.startTone(ToneGenerator.TONE_PROP_BEEP, 120)
        } catch (e: Exception) {
            // Audio hardware fallback
        }
        decodedResult = result
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xE60A1414))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Bar
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = scannerTitle,
                            style = MaterialTheme.typography.titleMedium,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = scannerTitleKh,
                            style = MaterialTheme.typography.bodySmall,
                            color = MedicalLightTeal
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Flashlight Toggle
                        Surface(
                            shape = CircleShape,
                            color = if (isFlashlightOn) MedicalLightTeal else Color(0x33FFFFFF),
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .clickable { isFlashlightOn = !isFlashlightOn }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = if (isFlashlightOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                                    contentDescription = "Flashlight",
                                    tint = if (isFlashlightOn) MedicalDeepTeal else Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // Close Button
                        Surface(
                            shape = CircleShape,
                            color = Color(0x33FFFFFF),
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .clickable { onDismiss() }
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Close",
                                    tint = Color.White,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Scanning Viewport Box
                Box(
                    modifier = Modifier
                        .size(260.dp)
                        .background(Color(0x1A000000), shape = RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    // Corner targeting reticle and animated laser
                    ScanningViewportReticle()

                    // Center camera visual indicator
                    Icon(
                        imageVector = Icons.Default.QrCodeScanner,
                        contentDescription = null,
                        tint = Color(0x33FFFFFF),
                        modifier = Modifier.size(72.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Align patient wristband QR or GS1 ampoule barcode inside target",
                    color = Color(0xFFD0D7D6),
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Quick Simulator Test Trigger Bar for Field Audits
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = Color(0x26006A6A),
                    border = BorderStroke(1.dp, MedicalDeepTeal.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "Clinical Quick Simulation Triggers",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalLightTeal
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val simulatedWristband = "KRUPET:HN:KP-2026-0882:NAME:Chan Sokha"
                                    playFeedbackAndEmit(ClinicalBarcodeParser.parse(simulatedWristband))
                                },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Wristband",
                                    fontSize = 11.sp
                                )
                            }

                            OutlinedButton(
                                onClick = {
                                    val simulatedGs1 = "(01)08850123456789(17)271231(10)LOT-MOR-2026(21)SN-449102"
                                    playFeedbackAndEmit(ClinicalBarcodeParser.parse(simulatedGs1))
                                },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Ampoule GS1",
                                    fontSize = 11.sp
                                )
                            }

                            OutlinedButton(
                                onClick = {
                                    val expiredGs1 = "(01)08850123456789(17)240101(10)LOT-EXP-2024(21)SN-998811"
                                    playFeedbackAndEmit(ClinicalBarcodeParser.parse(expiredGs1))
                                },
                                shape = RoundedCornerShape(6.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF8A80)),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Expired GS1",
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Manual Input Fallback Accordion
                TextButton(
                    onClick = { showManualInput = !showManualInput }
                ) {
                    Text(
                        text = if (showManualInput) "លាក់ការបញ្ចូលដោយដៃ - Hide Manual Input" else "បញ្ចូលកូដដោយផ្ទាល់ - Manual Input Fallback",
                        color = MedicalLightTeal,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                AnimatedVisibility(visible = showManualInput) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = manualInput,
                            onValueChange = { manualInput = it },
                            placeholder = { Text("Enter HN or GS1 barcode text", color = Color.Gray, fontSize = 12.sp) },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                            keyboardActions = KeyboardActions(onDone = {
                                if (manualInput.isNotBlank()) {
                                    playFeedbackAndEmit(ClinicalBarcodeParser.parse(manualInput))
                                }
                            }),
                            trailingIcon = {
                                IconButton(
                                    onClick = {
                                        if (manualInput.isNotBlank()) {
                                            playFeedbackAndEmit(ClinicalBarcodeParser.parse(manualInput))
                                        }
                                    }
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Submit",
                                        tint = MedicalLightTeal
                                    )
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedBorderColor = MedicalLightTeal,
                                unfocusedBorderColor = Color(0x66FFFFFF)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Decoded Result Card Display
                decodedResult?.let { result ->
                    DecodedResultSheet(
                        result = result,
                        onConfirm = {
                            onScanSuccess(result)
                            onDismiss()
                        },
                        onRescan = { decodedResult = null }
                    )
                }
            }
        }
    }
}

@Composable
private fun ScanningViewportReticle() {
    val infiniteTransition = rememberInfiniteTransition(label = "ReticleLaserAnimation")
    val laserFraction by infiniteTransition.animateFloat(
        initialValue = 0.05f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LaserYFraction"
    )

    Canvas(modifier = Modifier.fillMaxSize()) {
        val w = size.width
        val h = size.height
        val cornerLength = 28.dp.toPx()
        val cornerThickness = 4.dp.toPx()
        val cornerColor = Color(0xFF6FF7F5) // MedicalLightTeal high contrast

        // Top-Left corner
        drawLine(cornerColor, Offset(0f, 0f), Offset(cornerLength, 0f), cornerThickness)
        drawLine(cornerColor, Offset(0f, 0f), Offset(0f, cornerLength), cornerThickness)

        // Top-Right corner
        drawLine(cornerColor, Offset(w, 0f), Offset(w - cornerLength, 0f), cornerThickness)
        drawLine(cornerColor, Offset(w, 0f), Offset(w, cornerLength), cornerThickness)

        // Bottom-Left corner
        drawLine(cornerColor, Offset(0f, h), Offset(cornerLength, h), cornerThickness)
        drawLine(cornerColor, Offset(0f, h), Offset(0f, h - cornerLength), cornerThickness)

        // Bottom-Right corner
        drawLine(cornerColor, Offset(w, h), Offset(w - cornerLength, h), cornerThickness)
        drawLine(cornerColor, Offset(w, h), Offset(w, h - cornerLength), cornerThickness)

        // Animated Scanning Laser Beam
        val laserY = h * laserFraction
        drawLine(
            color = Color(0xFFFF5252), // Laser red beam
            start = Offset(12.dp.toPx(), laserY),
            end = Offset(w - 12.dp.toPx(), laserY),
            strokeWidth = 2.5.dp.toPx()
        )
    }
}

@Composable
private fun DecodedResultSheet(
    result: ScanResult,
    onConfirm: () -> Unit,
    onRescan: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            when (result) {
                is ScanResult.PatientWristband -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = MedicalDeepTeal.copy(alpha = 0.12f),
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Person,
                                    contentDescription = null,
                                    tint = MedicalDeepTeal,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Patient Wristband Verified",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                            Text(
                                text = "កូដខ្សែដៃអ្នកជំងឺ: ${result.hospitalNumber}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MedicalSlate
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    DetailItem("Patient Name", result.patientName)
                    DetailItem("Hospital Number", result.hospitalNumber)
                    DetailItem("Raw QR Data", result.rawCode)
                }

                is ScanResult.MedicationGs1 -> {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            shape = CircleShape,
                            color = if (result.isExpired) Color(0xFFFFEBEE) else MedicalDeepTeal.copy(alpha = 0.12f),
                            modifier = Modifier.size(40.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = if (result.isExpired) Icons.Default.Warning else Icons.Default.Medication,
                                    contentDescription = null,
                                    tint = if (result.isExpired) Color(0xFFD32F2F) else MedicalDeepTeal,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = if (result.isExpired) "EXPIRED MEDICATION WARNING" else "GS1 Medication Barcode Decoded",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = if (result.isExpired) Color(0xFFD32F2F) else MedicalDeepTeal
                            )
                            Text(
                                text = "បាកូដឱសថវេជ្ជសាស្ត្រ GS1 DataMatrix",
                                style = MaterialTheme.typography.bodySmall,
                                color = MedicalSlate
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    DetailItem("GTIN: Global Trade Item Number", result.gtin)
                    DetailItem("Expiration Date: កាលបរិច្ឆេទផុតកំណត់", result.expiryDate)
                    DetailItem("Batch/Lot: លេខឡូតិ៍ផលិត", result.batchNumber)
                    DetailItem("Serial Number: លេខស៊េរី", result.serialNumber)

                    if (result.isExpired) {
                        Spacer(modifier = Modifier.height(6.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = Color(0xFFFFCDD2),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "WARNING: Medication batch has passed expiration date. Administration prohibited under hospital safety standards.",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB71C1C),
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }
                }

                is ScanResult.GeneralCode -> {
                    Text(
                        text = "Scanned Clinical Code - លេខកូដទូទៅ",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    DetailItem("Type", result.codeType)
                    DetailItem("Value", result.value)
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onConfirm,
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = "Confirm and Select - ជ្រើសរើស",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }

                OutlinedButton(
                    onClick = onRescan,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(0.5f)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Rescan",
                        fontSize = 12.sp,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailItem(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            color = MedicalSlate
        )
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
            color = MedicalOnSurface
        )
    }
}
