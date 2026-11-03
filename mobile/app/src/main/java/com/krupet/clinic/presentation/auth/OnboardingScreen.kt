package com.krupet.clinic.presentation.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*

data class StaffDutyProfile(
    val id: String,
    val nameEn: String,
    val nameKh: String,
    val titleEn: String,
    val titleKh: String,
    val department: String,
    val initials: String,
    val roleColor: Color
)

@Composable
fun OnboardingScreen(
    onDutyConfirmed: () -> Unit
) {
    val profiles = remember {
        listOf(
            StaffDutyProfile(
                id = "doc1",
                nameEn = "Dr. Sokha Rath, MD",
                nameKh = "វេជ្ជបណ្ឌិត រ័ត្ន សុខា",
                titleEn = "Lead Attending - Internal Medicine & ICU",
                titleKh = "ប្រធានផ្នែក ជំងឺទូទៅ និង សង្គ្រោះបន្ទាន់ ICU",
                department = "ICU & Inpatient",
                initials = "SR",
                roleColor = MedicalDeepTeal
            ),
            StaffDutyProfile(
                id = "rn1",
                nameEn = "RN Bopha Chann",
                nameKh = "គិលានុបដ្ឋាយិកា ចាន់ បុប្ផា",
                titleEn = "Clinical Nurse Lead - Triage & Ward A",
                titleKh = "គិលានុបដ្ឋាយិកាទទួលបន្ទុក ផ្នែកពិនិត្យ និង សម្រាកពេទ្យ",
                department = "Emergency & Triage",
                initials = "BC",
                roleColor = Color(0xFF1E6B37)
            ),
            StaffDutyProfile(
                id = "dent1",
                nameEn = "Dr. Vireak Chea, DDS",
                nameKh = "ទន្តបណ្ឌិត ជា វិរៈ",
                titleEn = "Dental Specialist - Oral Surgery",
                titleKh = "ឯកទេស ទន្តសាស្ត្រ និង វះកាត់មាត់ធ្មេញ",
                department = "Dental Department",
                initials = "VC",
                roleColor = Color(0xFF00796B)
            ),
            StaffDutyProfile(
                id = "pharm1",
                nameEn = "RPh Sothea Heng",
                nameKh = "ឱសថការី ហេង សុធា",
                titleEn = "Clinical Pharmacist - Antimicrobial PK",
                titleKh = "ឱសថការីគ្លីនិក ទទួលបន្ទុកថ្នាំផ្សះ និង ឃ្លាំងឱសថ",
                department = "Central Pharmacy",
                initials = "SH",
                roleColor = Color(0xFF6A1B9A)
            )
        )
    }

    var selectedStaff by remember { mutableStateOf(profiles[0]) }
    var isBiometricScanning by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(20.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // Station Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "ជ្រើសរើសវេជ្ជបណ្ឌិត ឬ បុគ្គលិកប្រចាំការ",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
                Text(
                    text = "Duty Station Sign-In - Zero-Trust Identity",
                    style = MaterialTheme.typography.bodySmall,
                    color = MedicalSlate
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color(0xFFE0F2F1))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "មន្ទីរពេទ្យ គ្រូពេទ្យ",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Staff Selection Cards
        profiles.forEach { profile ->
            val isSelected = selectedStaff.id == profile.id
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 5.dp)
                    .clickable { selectedStaff = profile }
                    .border(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) profile.roleColor else MedicalBorder,
                        shape = RoundedCornerShape(16.dp)
                    ),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isSelected) Color(0xFFE0F2F1).copy(alpha = 0.4f) else MedicalSurface
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = if (isSelected) 3.dp else 1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(profile.roleColor),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = profile.initials,
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = profile.nameKh,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = MedicalOnSurface
                        )
                        Text(
                            text = profile.nameEn,
                            style = MaterialTheme.typography.bodySmall,
                            color = MedicalSlate,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = profile.titleKh,
                            fontSize = 11.sp,
                            color = MedicalDeepTeal
                        )
                    }

                    RadioButton(
                        selected = isSelected,
                        onClick = { selectedStaff = profile },
                        colors = RadioButtonDefaults.colors(selectedColor = profile.roleColor)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Biometric Authentication Section
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MedicalSurface),
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, MedicalBorder, RoundedCornerShape(16.dp))
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "ផ្ទៀងផ្ទាត់ជីវមាត្រ - Biometric Verification",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = MedicalOnSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "ប្រើក្រយៅដៃ ឬ ស្កេនទម្រង់មុខ ដើម្បីបើកដំណើរការម៉ាស៊ីនចល័ត",
                    fontSize = 11.sp,
                    color = MedicalSlate
                )

                Spacer(modifier = Modifier.height(18.dp))

                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE0F2F1))
                        .clickable { onDutyConfirmed() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "BIO",
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal,
                        fontSize = 16.sp
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    onClick = onDutyConfirmed,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal)
                ) {
                    Text(
                        text = "ចូលបំពេញការងារប្រចាំការ - Sign In to Duty",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}
