package com.krupet.clinic.presentation.chemo

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Medication
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel
import com.krupet.clinic.core.designsystem.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.text.DecimalFormat
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.roundToInt
import kotlin.math.sqrt

// Pre-chemotherapy safety thresholds
const val MIN_ANC_SAFETY_THRESHOLD = 1500.0 // /uL
const val MIN_PLATELETS_SAFETY_THRESHOLD = 100000.0 // /uL
const val MAX_CREATININE_SAFETY_THRESHOLD = 1.5 // mg/dL
const val MAX_BILIRUBIN_SAFETY_THRESHOLD = 1.5 // mg/dL

enum class VesicantDrugClass(
    val titleEn: String,
    val titleKh: String,
    val examples: String,
    val primaryAntidoteEn: String,
    val primaryAntidoteKh: String,
    val thermalProtocolEn: String,
    val thermalProtocolKh: String
) {
    ANTHRACYCLINE(
        titleEn = "DNA-Binding Vesicant: Anthracyclines",
        titleKh = "ឱសថជ្រាបបំផ្លាញ DNA: ក្រុម Anthracyclines",
        examples = "Doxorubicin, Daunorubicin, Epirubicin, Idarubicin",
        primaryAntidoteEn = "Dexrazoxane IV: 1,000 mg/m2 within 6 hours. Topical DMSO 99% alternate.",
        primaryAntidoteKh = "ថ្នាំបន្សាប Dexrazoxane ចាក់តាមសរសៃឈាម ១,០០០ មីលីក្រាមក្នុង ១ ម៉ែត្រការ៉េ ក្នុងរយៈពេល ៦ ម៉ោង",
        thermalProtocolEn = "COLD DRY PACKS: Apply 15-20 min 4x daily. Strictly avoid warmth.",
        thermalProtocolKh = "ស្អំបន្ទះត្រជាក់ស្ងួត: ១៥ ទៅ ២០ នាទី ៤ ដងក្នុងមួយថ្ងៃ - ហាមស្អំកម្តៅជាដាច់ខាត"
    ),
    VINCA_ALKALOID(
        titleEn = "Non-DNA Binding Vesicant: Vinca Alkaloids",
        titleKh = "ឱសថជ្រាបកោសិកា: ក្រុម Vinca Alkaloids",
        examples = "Vincristine, Vinblastine, Vinorelbine",
        primaryAntidoteEn = "Hyaluronidase: 150 to 1,500 units subcutaneous in clock pattern around site.",
        primaryAntidoteKh = "ថ្នាំបន្សាប Hyaluronidase ចាក់ក្រោមស្បែក ១៥០ ទៅ ១,៥០០ យូនីត ជុំវិញកន្លែងជ្រាប",
        thermalProtocolEn = "WARM DRY PACKS: Apply 15-20 min 4x daily to promote vasodilation. Strictly avoid cold.",
        thermalProtocolKh = "ស្អំបន្ទះក្តៅឧណ្ហៗ: ១៥ ទៅ ២០ នាទី ៤ ដងក្នុងមួយថ្ងៃ ដើម្បីពង្រីកសរសៃឈាម - ហាមស្អំត្រជាក់"
    ),
    TAXANE_IRRITANT(
        titleEn = "Vesicant / Irritant with Extravasation Potential: Taxanes & Platinum",
        titleKh = "ឱសថរលាក និងជ្រាប: ក្រុម Taxanes និង Platinum",
        examples = "Paclitaxel, Docetaxel, Cisplatin, Carboplatin",
        primaryAntidoteEn = "Hyaluronidase 150-300 units SC or Sodium Thiosulfate for Cisplatin.",
        primaryAntidoteKh = "ថ្នាំបន្សាប Hyaluronidase ឬ Sodium Thiosulfate សម្រាប់ Cisplatin",
        thermalProtocolEn = "WARM or COLD PACKS: Apply cold for Cisplatin, warm for Paclitaxel.",
        thermalProtocolKh = "ស្អំបន្ទះត្រជាក់សម្រាប់ Cisplatin និងស្អំបន្ទះក្តៅសម្រាប់ Paclitaxel"
    )
}

enum class InfusionPumpStatus {
    LOCKED,
    READY_TO_START,
    INFUSING,
    PAUSED,
    COMPLETED
}

data class ChemotherapyUiState(
    // Patient Anthropometrics
    val patientName: String = "Keo Pisey - កែវ ពិសី",
    val patientCode: String = "HN-2026-ONC-048",
    val ageYearsInput: String = "56",
    val gender: String = "FEMALE",
    val heightCmInput: String = "158",
    val weightKgInput: String = "52.5",

    // Carboplatin Calvert Engine parameters
    val serumCreatinineMgDlInput: String = "0.85",
    val targetAucInput: String = "5.0", // AUC 4 to 6

    // Pre-chemo laboratory safety gates
    val ancInput: String = "2200", // /uL
    val plateletsInput: String = "185000", // /uL
    val totalBilirubinInput: String = "0.7", // mg/dL
    val astAltInput: String = "32", // U/L

    // Dual Oncology Nurse Biometric Sign-Off Gate
    val nurse1Name: String = "Sr. Vanna Srey (RN-ONC-104)",
    val nurse1Signed: Boolean = false,
    val nurse2Name: String = "Sr. Rachana Pich (RN-ONC-288)",
    val nurse2Signed: Boolean = false,

    // Infusion Pump Controller State
    val pumpStatus: InfusionPumpStatus = InfusionPumpStatus.LOCKED,
    val totalInfusionVolumeMl: Double = 500.0,
    val infusionRateMlPerHour: Double = 250.0,
    val infusedVolumeMl: Double = 0.0,
    val remainingMinutes: Int = 120,

    // Selected Extravasation Antidote Module
    val selectedVesicantClass: VesicantDrugClass = VesicantDrugClass.ANTHRACYCLINE,
    val extravasationChecklist: List<Pair<String, Boolean>> = listOf(
        "1. Stop antineoplastic infusion immediately and clamp tubing" to false,
        "2. Do NOT remove IV cannula; aspirate 3-5 mL residual drug and blood" to false,
        "3. Administer specific antidote: Dexrazoxane or Hyaluronidase" to false,
        "4. Remove IV catheter and elevate extremity above heart level" to false,
        "5. Apply designated thermal pack: Cold for Anthracycline, Warm for Vinca" to false,
        "6. Document extravasation event, photograph site, and notify oncologist" to false
    )
) {
    val heightCm: Double get() = heightCmInput.toDoubleOrNull() ?: 158.0
    val weightKg: Double get() = weightKgInput.toDoubleOrNull() ?: 52.5
    val ageYears: Int get() = ageYearsInput.toIntOrNull() ?: 56
    val serumCreatinine: Double get() = serumCreatinineMgDlInput.toDoubleOrNull() ?: 0.85
    val targetAuc: Double get() = targetAucInput.toDoubleOrNull() ?: 5.0

    val anc: Double get() = ancInput.toDoubleOrNull() ?: 2200.0
    val platelets: Double get() = plateletsInput.toDoubleOrNull() ?: 185000.0
    val totalBilirubin: Double get() = totalBilirubinInput.toDoubleOrNull() ?: 0.7

    // 1. Mosteller BSA Formula: sqrt((height_cm * weight_kg) / 3600)
    val bsaMosteller: Double
        get() = if (heightCm > 0 && weightKg > 0) {
            val raw = sqrt((heightCm * weightKg) / 3600.0)
            (raw * 100.0).roundToInt() / 100.0
        } else 0.0

    // 2. DuBois & DuBois BSA Formula: 0.007184 * height^0.725 * weight^0.425
    val bsaDuBois: Double
        get() = if (heightCm > 0 && weightKg > 0) {
            val raw = 0.007184 * heightCm.pow(0.725) * weightKg.pow(0.425)
            (raw * 100.0).roundToInt() / 100.0
        } else 0.0

    // Cockcroft-Gault Creatinine Clearance (mL/min)
    val rawCrCl: Double
        get() = if (serumCreatinine > 0 && weightKg > 0) {
            val femaleFactor = if (gender == "FEMALE") 0.85 else 1.0
            val raw = ((140.0 - ageYears) * weightKg * femaleFactor) / (72.0 * serumCreatinine)
            (raw * 10.0).roundToInt() / 10.0
        } else 0.0

    // ASCO / FDA GFR Cap at 125 mL/min
    val cappedGfr: Double
        get() = min(rawCrCl, 125.0)

    val isGfrCapped: Boolean
        get() = rawCrCl > 125.0

    // Calvert Carboplatin Total Dose: Total Dose (mg) = Target AUC * (GFR + 25)
    val carboplatinDoseMg: Double
        get() = if (targetAuc > 0 && cappedGfr > 0) {
            val raw = targetAuc * (cappedGfr + 25.0)
            (raw * 10.0).roundToInt() / 10.0
        } else 0.0

    // Pre-chemotherapy organ and hematologic hard stop evaluation
    val isAncSafe: Boolean get() = anc >= MIN_ANC_SAFETY_THRESHOLD
    val isPlateletsSafe: Boolean get() = platelets >= MIN_PLATELETS_SAFETY_THRESHOLD
    val isCreatinineSafe: Boolean get() = serumCreatinine <= MAX_CREATININE_SAFETY_THRESHOLD
    val isBilirubinSafe: Boolean get() = totalBilirubin <= MAX_BILIRUBIN_SAFETY_THRESHOLD

    val isHematologicOrganClearancePassed: Boolean
        get() = isAncSafe && isPlateletsSafe && isCreatinineSafe && isBilirubinSafe

    val isDualNurseSigned: Boolean
        get() = nurse1Signed && nurse2Signed

    val canStartPump: Boolean
        get() = isHematologicOrganClearancePassed && isDualNurseSigned
}

class ChemotherapyViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(ChemotherapyUiState())
    val uiState: StateFlow<ChemotherapyUiState> = _uiState.asStateFlow()

    fun updateHeight(height: String) {
        _uiState.update { it.copy(heightCmInput = height) }
    }

    fun updateWeight(weight: String) {
        _uiState.update { it.copy(weightKgInput = weight) }
    }

    fun updateAge(age: String) {
        _uiState.update { it.copy(ageYearsInput = age) }
    }

    fun updateGender(gender: String) {
        _uiState.update { it.copy(gender = gender) }
    }

    fun updateSerumCreatinine(creat: String) {
        _uiState.update { it.copy(serumCreatinineMgDlInput = creat) }
    }

    fun updateTargetAuc(auc: String) {
        _uiState.update { it.copy(targetAucInput = auc) }
    }

    fun updateAnc(anc: String) {
        _uiState.update { it.copy(ancInput = anc) }
    }

    fun updatePlatelets(plt: String) {
        _uiState.update { it.copy(plateletsInput = plt) }
    }

    fun updateTotalBilirubin(bili: String) {
        _uiState.update { it.copy(totalBilirubinInput = bili) }
    }

    fun signNurse1() {
        _uiState.update { state ->
            val updated = state.copy(nurse1Signed = true)
            evaluatePumpReadiness(updated)
        }
    }

    fun signNurse2() {
        _uiState.update { state ->
            val updated = state.copy(nurse2Signed = true)
            evaluatePumpReadiness(updated)
        }
    }

    fun resetNurseSignOff() {
        _uiState.update {
            it.copy(
                nurse1Signed = false,
                nurse2Signed = false,
                pumpStatus = InfusionPumpStatus.LOCKED
            )
        }
    }

    fun startInfusionPump() {
        if (_uiState.value.canStartPump) {
            _uiState.update { it.copy(pumpStatus = InfusionPumpStatus.INFUSING) }
        }
    }

    fun pauseInfusionPump() {
        _uiState.update { it.copy(pumpStatus = InfusionPumpStatus.PAUSED) }
    }

    fun stopInfusionPump() {
        _uiState.update { it.copy(pumpStatus = InfusionPumpStatus.LOCKED) }
    }

    fun selectVesicantClass(drugClass: VesicantDrugClass) {
        _uiState.update { it.copy(selectedVesicantClass = drugClass) }
    }

    fun toggleChecklistItem(index: Int) {
        _uiState.update { state ->
            val updated = state.extravasationChecklist.toMutableList()
            if (index in updated.indices) {
                val current = updated[index]
                updated[index] = current.first to !current.second
            }
            state.copy(extravasationChecklist = updated)
        }
    }

    private fun evaluatePumpReadiness(state: ChemotherapyUiState): ChemotherapyUiState {
        return if (state.canStartPump) {
            state.copy(pumpStatus = InfusionPumpStatus.READY_TO_START)
        } else {
            state.copy(pumpStatus = InfusionPumpStatus.LOCKED)
        }
    }
}

@Composable
fun ChemotherapyScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: ChemotherapyViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Clinical Screen Header
        ChemoHeaderSection(
            patientName = state.patientName,
            patientCode = state.patientCode
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Pre-Chemotherapy Hematologic and Organ Function Hard Stops
        OrganFunctionHardStopsCard(
            state = state,
            onAncChange = { viewModel.updateAnc(it) },
            onPltChange = { viewModel.updatePlatelets(it) },
            onCreatChange = { viewModel.updateSerumCreatinine(it) },
            onBiliChange = { viewModel.updateTotalBilirubin(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Body Surface Area (BSA) Dual-Formula Engine (Mosteller vs DuBois)
        BsaCalculatorCard(
            state = state,
            onHeightChange = { viewModel.updateHeight(it) },
            onWeightChange = { viewModel.updateWeight(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Carboplatin Calvert Dosing Engine (Target AUC * [GFR + 25]) with GFR 125 Capping
        CalvertCarboplatinCard(
            state = state,
            onAgeChange = { viewModel.updateAge(it) },
            onGenderChange = { viewModel.updateGender(it) },
            onAucChange = { viewModel.updateTargetAuc(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Dual Oncology Nurse Biometric Sign-Off Gate & Pump Activation Controller
        DualNurseSignOffPumpCard(
            state = state,
            onSignNurse1 = { viewModel.signNurse1() },
            onSignNurse2 = { viewModel.signNurse2() },
            onResetSignOff = { viewModel.resetNurseSignOff() },
            onStartPump = { viewModel.startInfusionPump() },
            onPausePump = { viewModel.pauseInfusionPump() },
            onStopPump = { viewModel.stopInfusionPump() }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Vesicant Extravasation Antidote Checklist
        ExtravasationAntidoteCard(
            state = state,
            onSelectClass = { viewModel.selectVesicantClass(it) },
            onToggleChecklist = { viewModel.toggleChecklistItem(it) }
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Oncology Regulatory Standard Compliance Footer
        ChemoSafetyFooter()
    }
}

@Composable
private fun ChemoHeaderSection(
    patientName: String,
    patientCode: String
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Oncology Infusion Bedside Station",
                        style = MaterialTheme.typography.titleLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "ស្ថានីយបញ្ចូលឱសថគីមីព្យាបាលជំងឺមហារីក",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFF6A1B9A).copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "ONCOLOGY BED 02",
                        color = Color(0xFF6A1B9A),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 10.dp),
                color = MedicalSurfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(text = "Patient - អ្នកជំងឺ", fontSize = 11.sp, color = MedicalSlate)
                    Text(
                        text = patientName,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalOnSurface
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = "Medical Record Number", fontSize = 11.sp, color = MedicalSlate)
                    Text(
                        text = patientCode,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }
            }
        }
    }
}

@Composable
private fun OrganFunctionHardStopsCard(
    state: ChemotherapyUiState,
    onAncChange: (String) -> Unit,
    onPltChange: (String) -> Unit,
    onCreatChange: (String) -> Unit,
    onBiliChange: (String) -> Unit
) {
    val isCleared = state.isHematologicOrganClearancePassed
    val statusColor by animateColorAsState(
        targetValue = if (isCleared) MedicalDeepTeal else MedicalError,
        label = "SafetyStatusColor"
    )

    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        border = BorderStroke(1.5.dp, statusColor.copy(alpha = 0.7f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (isCleared) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = null,
                        tint = statusColor,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Pre-Chemo Hematologic & Organ Clearance",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = statusColor
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = statusColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = if (isCleared) "SAFETY CLEARED" else "HARD STOP TRIGGERED",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = statusColor,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "ការត្រួតពិនិត្យសុវត្ថិភាពសរីរាង្គ និងឈាមមុនបញ្ចូលគីមី: ASCO និង NCCN Standards",
                fontSize = 11.sp,
                color = MedicalSlate
            )

            // Alert banner if hard stop triggered
            if (!isCleared) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFFEBEE),
                    border = BorderStroke(1.dp, MedicalError),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "CRITICAL SAFETY HARD STOP: PUMP ACTIVATION BLOCKED",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalError
                        )
                        Text(
                            text = "Patient hematologic or organ function values violate minimum clinical safety margins. Chemotherapy administration is strictly prohibited until licensed oncologist review.",
                            fontSize = 10.sp,
                            color = MedicalError,
                            lineHeight = 14.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // 4 Safety Input Metrics Grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SafetyMetricItem(
                    label = "ANC: /uL",
                    subLabel = "គោលិកាឈាមស",
                    value = state.ancInput,
                    onValueChange = onAncChange,
                    thresholdText = "Min: 1,500",
                    isSafe = state.isAncSafe,
                    modifier = Modifier.weight(1f)
                )

                SafetyMetricItem(
                    label = "Platelets: /uL",
                    subLabel = "ប្លាកែត",
                    value = state.plateletsInput,
                    onValueChange = onPltChange,
                    thresholdText = "Min: 100,000",
                    isSafe = state.isPlateletsSafe,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                SafetyMetricItem(
                    label = "Creatinine: mg/dL",
                    subLabel = "ក្រេអាទីនីន",
                    value = state.serumCreatinineMgDlInput,
                    onValueChange = onCreatChange,
                    thresholdText = "Max: 1.5",
                    isSafe = state.isCreatinineSafe,
                    modifier = Modifier.weight(1f)
                )

                SafetyMetricItem(
                    label = "Bilirubin: mg/dL",
                    subLabel = "ប៊ីលីរុយប៊ីន",
                    value = state.totalBilirubinInput,
                    onValueChange = onBiliChange,
                    thresholdText = "Max: 1.5",
                    isSafe = state.isBilirubinSafe,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun SafetyMetricItem(
    label: String,
    subLabel: String,
    value: String,
    onValueChange: (String) -> Unit,
    thresholdText: String,
    isSafe: Boolean,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label, fontSize = 11.sp) },
        supportingText = {
            Text(
                text = "$subLabel | $thresholdText",
                fontSize = 9.sp,
                color = if (isSafe) MedicalSlate else MedicalError
            )
        },
        isError = !isSafe,
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = if (isSafe) MedicalDeepTeal else MedicalError,
            unfocusedBorderColor = if (isSafe) MedicalSurfaceVariant else MedicalError.copy(alpha = 0.6f)
        ),
        modifier = modifier
    )
}

@Composable
private fun BsaCalculatorCard(
    state: ChemotherapyUiState,
    onHeightChange: (String) -> Unit,
    onWeightChange: (String) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "Body Surface Area - BSA Dual Formula Engine",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = "ការគណនាផ្ទៃក្រឡារាងកាយ BSA: Mosteller និង DuBois & DuBois",
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Height and Weight Inputs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedTextField(
                    value = state.heightCmInput,
                    onValueChange = onHeightChange,
                    label = { Text("Height: cm - កម្ពស់") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )

                OutlinedTextField(
                    value = state.weightKgInput,
                    onValueChange = onWeightChange,
                    label = { Text("Weight: kg - ទម្ងន់") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Dual BSA Comparison Display
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Mosteller Card
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MedicalSurfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, MedicalDeepTeal.copy(alpha = 0.3f)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "MOSTELLER FORMULA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalDeepTeal
                        )
                        Text(
                            text = "sqrt(height * weight / 3600)",
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            color = MedicalSlate
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "${state.bsaMosteller} m2",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalDeepTeal
                        )
                        Text(
                            text = "Standard Oncology Dose Base",
                            fontSize = 10.sp,
                            color = MedicalSlate
                        )
                    }
                }

                // DuBois & DuBois Card
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = MedicalSurfaceVariant.copy(alpha = 0.5f),
                    border = BorderStroke(1.dp, MedicalSlate.copy(alpha = 0.3f)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "DUBOIS & DUBOIS FORMULA",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalSlate
                        )
                        Text(
                            text = "0.007184 * H^0.725 * W^0.425",
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            color = MedicalSlate
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "${state.bsaDuBois} m2",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalOnSurface
                        )
                        val delta = (state.bsaMosteller - state.bsaDuBois)
                        Text(
                            text = "Delta: ${String.format(Locale.US, "%+.2f", delta)} m2",
                            fontSize = 10.sp,
                            color = MedicalSlate
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CalvertCarboplatinCard(
    state: ChemotherapyUiState,
    onAgeChange: (String) -> Unit,
    onGenderChange: (String) -> Unit,
    onAucChange: (String) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Carboplatin Calvert Dosing Engine",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "រូបមន្តកាល់វែត: Total Dose = Target AUC * (GFR + 25)",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (state.isGfrCapped) Color(0xFFFFF3E0) else MedicalLightTeal.copy(alpha = 0.25f)
                ) {
                    Text(
                        text = if (state.isGfrCapped) "GFR CAPPED AT 125" else "GFR UNRESTRICTED",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (state.isGfrCapped) Color(0xFFE65100) else MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Patient Age, Gender & Target AUC Inputs
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = state.ageYearsInput,
                    onValueChange = onAgeChange,
                    label = { Text("Age: Years") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )

                OutlinedTextField(
                    value = state.targetAucInput,
                    onValueChange = onAucChange,
                    label = { Text("Target AUC: 4 - 6") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    singleLine = true,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Cockcroft-Gault & Calvert Results Summary
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                border = BorderStroke(1.dp, MedicalSurfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(text = "Cockcroft-Gault CrCl:", fontSize = 11.sp, color = MedicalSlate)
                            Text(
                                text = "${state.rawCrCl} mL/min",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalOnSurface
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(text = "ASCO Capped GFR Used:", fontSize = 11.sp, color = MedicalSlate)
                            Text(
                                text = "${state.cappedGfr} mL/min",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (state.isGfrCapped) Color(0xFFE65100) else MedicalDeepTeal
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    HorizontalDivider(color = MedicalSurfaceVariant)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "CALCULATED CARBOPLATIN DOSE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalDeepTeal
                            )
                            Text(
                                text = "កម្រិតថ្នាំ Carboplatin សរុបត្រូវបញ្ចូល",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MedicalOnSurface
                            )
                        }

                        Text(
                            text = "${state.carboplatinDoseMg} mg",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalDeepTeal
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DualNurseSignOffPumpCard(
    state: ChemotherapyUiState,
    onSignNurse1: () -> Unit,
    onSignNurse2: () -> Unit,
    onResetSignOff: () -> Unit,
    onStartPump: () -> Unit,
    onPausePump: () -> Unit,
    onStopPump: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (state.isDualNurseSigned) Icons.Default.LockOpen else Icons.Default.Lock,
                        contentDescription = null,
                        tint = if (state.isDualNurseSigned) MedicalDeepTeal else MedicalError,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Dual Oncology Nurse Biometric Gate",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal
                    )
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = if (state.isDualNurseSigned) MedicalLightTeal.copy(alpha = 0.25f) else Color(0xFFFFEBEE)
                ) {
                    Text(
                        text = if (state.isDualNurseSigned) "DUAL SIGNED" else "GATE LOCKED",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (state.isDualNurseSigned) MedicalDeepTeal else MedicalError,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "ការចុះហត្ថលេខាទ្វេភាគីដោយគិលានុបដ្ឋាយិកាជំនាញមហារីក ២ នាក់ មុនដំណើរការម៉ាស៊ីន",
                fontSize = 11.sp,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Nurse 1 Sign-Off Strip
            NurseSignStrip(
                nurseTitle = "Primary Administering Nurse",
                nurseTitleKh = "គិលានុបដ្ឋាយិកាទី ១: អ្នករៀបចំឱសថ",
                nurseName = state.nurse1Name,
                isSigned = state.nurse1Signed,
                onSign = onSignNurse1
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Nurse 2 Sign-Off Strip
            NurseSignStrip(
                nurseTitle = "Independent Verifying Nurse",
                nurseTitleKh = "គិលានុបដ្ឋាយិកាទី ២: អ្នកផ្ទៀងផ្ទាត់ឯករាជ្យ",
                nurseName = state.nurse2Name,
                isSigned = state.nurse2Signed,
                onSign = onSignNurse2
            )

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = MedicalSurfaceVariant)
            Spacer(modifier = Modifier.height(12.dp))

            // Bedside Infusion Pump Controller Section
            Text(
                text = "Bedside Infusion Pump Control Unit",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )

            Spacer(modifier = Modifier.height(6.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "Pump Status: ${state.pumpStatus.name}", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedicalOnSurface)
                    Text(text = "Rate: ${state.infusionRateMlPerHour} mL/h | Total: ${state.totalInfusionVolumeMl} mL", fontSize = 11.sp, color = MedicalSlate)
                }

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = when (state.pumpStatus) {
                        InfusionPumpStatus.INFUSING -> MedicalLightTeal.copy(alpha = 0.35f)
                        InfusionPumpStatus.PAUSED -> Color(0xFFFFF3E0)
                        else -> MedicalSurfaceVariant
                    }
                ) {
                    Text(
                        text = if (state.pumpStatus == InfusionPumpStatus.INFUSING) "FLOWING" else "IDLE",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Pump Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = onStartPump,
                    enabled = state.canStartPump && state.pumpStatus != InfusionPumpStatus.INFUSING,
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Start Pump", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onPausePump,
                    enabled = state.pumpStatus == InfusionPumpStatus.INFUSING,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(0.8f)
                ) {
                    Icon(imageVector = Icons.Default.Pause, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Pause", fontSize = 12.sp)
                }

                OutlinedButton(
                    onClick = onStopPump,
                    enabled = state.pumpStatus != InfusionPumpStatus.LOCKED,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MedicalError),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(0.8f)
                ) {
                    Icon(imageVector = Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Stop", fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun NurseSignStrip(
    nurseTitle: String,
    nurseTitleKh: String,
    nurseName: String,
    isSigned: Boolean,
    onSign: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = if (isSigned) MedicalLightTeal.copy(alpha = 0.2f) else MedicalSurfaceVariant.copy(alpha = 0.45f),
        border = BorderStroke(1.dp, if (isSigned) MedicalDeepTeal else MedicalSurfaceVariant),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = nurseTitle, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedicalDeepTeal)
                Text(text = nurseTitleKh, fontSize = 10.sp, color = MedicalSlate)
                Text(text = nurseName, fontSize = 11.sp, fontWeight = FontWeight.Medium, color = MedicalOnSurface)
            }

            if (isSigned) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = MedicalDeepTeal, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "VERIFIED", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MedicalDeepTeal)
                }
            } else {
                Button(
                    onClick = onSign,
                    colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Icon(imageVector = Icons.Default.Fingerprint, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Sign Off", fontSize = 11.sp)
                }
            }
        }
    }
}

@Composable
private fun ExtravasationAntidoteCard(
    state: ChemotherapyUiState,
    onSelectClass: (VesicantDrugClass) -> Unit,
    onToggleChecklist: (Int) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = MedicalError,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Vesicant Extravasation Emergency Antidote Protocol",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MedicalDeepTeal
                )
            }
            Text(
                text = "ពិធីសារសង្គ្រោះបន្ទាន់ពេលឱសថគីមីជ្រាបចេញក្រៅសរសៃ: ONS & ESMO Guidelines",
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Drug Class Selector
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MedicalSurfaceVariant, shape = RoundedCornerShape(8.dp))
                    .padding(3.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                VesicantDrugClass.values().forEach { dClass ->
                    val isSelected = state.selectedVesicantClass == dClass
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(6.dp))
                            .clickable { onSelectClass(dClass) },
                        color = if (isSelected) MedicalDeepTeal else Color.Transparent,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Box(modifier = Modifier.padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                            Text(
                                text = dClass.name.replace("_", " "),
                                color = if (isSelected) Color.White else MedicalOnSurface,
                                fontSize = 9.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Specific Antidote Box
            Surface(
                shape = RoundedCornerShape(8.dp),
                color = Color(0xFFFFF3E0),
                border = BorderStroke(1.dp, Color(0xFFFFB74D)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = state.selectedVesicantClass.titleEn,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE65100)
                    )
                    Text(
                        text = "Examples: ${state.selectedVesicantClass.examples}",
                        fontSize = 11.sp,
                        color = Color(0xFF5D4037)
                    )

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "ANTIDOTE: ${state.selectedVesicantClass.primaryAntidoteEn}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFB71C1C)
                    )
                    Text(
                        text = state.selectedVesicantClass.primaryAntidoteKh,
                        fontSize = 10.sp,
                        color = Color(0xFF5D4037)
                    )

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "THERMAL: ${state.selectedVesicantClass.thermalProtocolEn}",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0D47A1)
                    )
                    Text(
                        text = state.selectedVesicantClass.thermalProtocolKh,
                        fontSize = 10.sp,
                        color = Color(0xFF5D4037)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Step-by-Step Extravasation Action Checklist
            Text(
                text = "Bedside Rescue Step-by-Step Checklist:",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(4.dp))

            state.extravasationChecklist.forEachIndexed { index, (stepText, isDone) ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onToggleChecklist(index) }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isDone,
                        onCheckedChange = { onToggleChecklist(index) },
                        colors = CheckboxDefaults.colors(checkedColor = MedicalDeepTeal)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = stepText,
                        fontSize = 11.sp,
                        color = if (isDone) MedicalSlate else MedicalOnSurface,
                        fontWeight = if (isDone) FontWeight.Normal else FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
private fun ChemoSafetyFooter() {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurfaceVariant.copy(alpha = 0.45f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Security,
                contentDescription = null,
                tint = MedicalDeepTeal,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(
                    text = "ASCO / ONS Chemotherapy Administration Safety Standards",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Requires verified independent double-checking of dose, calculation, pump rate, and lab clearance by two licensed oncology nurses prior to antineoplastic initiation.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}
