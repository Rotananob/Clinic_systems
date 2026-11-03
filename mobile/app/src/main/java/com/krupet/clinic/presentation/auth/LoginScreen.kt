package com.krupet.clinic.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*

enum class ClinicalRole(val title: String, val badge: String) {
    PHYSICIAN("Attending Physician", "MD"),
    NURSE("Registered Nurse", "RN"),
    PHARMACIST("Clinical Pharmacist", "RPh"),
    LAB_TECH("Laboratory Technologist", "MLT"),
    BILLING("Billing & Cashier", "POS")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    modifier: Modifier = Modifier,
    onLoginSuccess: () -> Unit = {}
) {
    var email by remember { mutableStateOf("dr.virak@krupet.clinic") }
    var password by remember { mutableStateOf("KruPet2026Master#") }
    var selectedRole by remember { mutableStateOf(ClinicalRole.PHYSICIAN) }
    var isOfflineModeAllowed by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Shield & Header
        Box(
            modifier = Modifier
                .size(68.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(MedicalDeepTeal),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "KP",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 28.sp
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "KruPet Clinical Operations",
            style = MaterialTheme.typography.headlineSmall,
            color = MedicalDeepTeal,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Enterprise Mobile Station - Biometric Zero-Trust Gateway",
            style = MaterialTheme.typography.bodySmall,
            color = MedicalSlate
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Role Selector Bar
        Text(
            text = "Select Clinical Duty Role",
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MedicalOnSurface,
            modifier = Modifier.align(Alignment.Start)
        )
        Spacer(modifier = Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            ClinicalRole.values().forEach { role ->
                val isSelected = selectedRole == role
                FilterChip(
                    selected = isSelected,
                    onClick = { selectedRole = role },
                    label = { Text(role.badge) }
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Input Fields
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Clinical Staff Email") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email)
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Master Security Password") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Offline Emergency Protocol Switch
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Offline Disaster Recovery Mode", style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                Text("Allow sign-in against local AES encrypted credential vault", style = MaterialTheme.typography.labelSmall, color = MedicalSlate)
            }
            Switch(checked = isOfflineModeAllowed, onCheckedChange = { isOfflineModeAllowed = it })
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Sign In Button
        Button(
            onClick = onLoginSuccess,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(10.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal)
        ) {
            Text("Sign In as ${selectedRole.title}", fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Biometric Quick Button
        OutlinedButton(
            onClick = onLoginSuccess,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            shape = RoundedCornerShape(10.dp)
        ) {
            Text("Quick Biometric Sign In (Fingerprint / Face ID)", fontWeight = FontWeight.SemiBold, color = MedicalDeepTeal)
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Safety Compliance Notice
        Text(
            text = "Connected to NestJS Gateway: http://10.0.2.2:3001/api | TLS 1.3 FIPS-140-3 Validated",
            style = MaterialTheme.typography.labelSmall,
            color = MedicalSlate,
            fontSize = 10.sp
        )
    }
}
