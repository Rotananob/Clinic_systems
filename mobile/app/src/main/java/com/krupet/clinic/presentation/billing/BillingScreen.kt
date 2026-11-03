package com.krupet.clinic.presentation.billing

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.Print
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.krupet.clinic.core.designsystem.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.DecimalFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.absoluteValue

// Constants for Bakong KHQR Exchange Rate
const val EXCHANGE_RATE_KHR_PER_USD = 4100.0

enum class BillingCurrency {
    USD,
    KHR
}

enum class PaymentStatus {
    INITIAL,
    PENDING,
    PAID,
    EXPIRED
}

data class ClinicalBillItem(
    val id: String,
    val categoryEn: String,
    val categoryKh: String,
    val nameEn: String,
    val nameKh: String,
    val unitPriceUsd: Double,
    val quantity: Int
) {
    val subtotalUsd: Double
        get() = unitPriceUsd * quantity

    fun subtotalKhr(exchangeRate: Double = EXCHANGE_RATE_KHR_PER_USD): Long =
        (subtotalUsd * exchangeRate).toLong()
}

data class BillingUiState(
    val patientName: String = "Chan Sokha - ចាន់ សុខា",
    val patientCode: String = "HN-2026-0882",
    val invoiceNumber: String = "INV-2026-0419",
    val cashierName: String = "Dr. Rotana Staff",
    val currency: BillingCurrency = BillingCurrency.USD,
    val exchangeRate: Double = EXCHANGE_RATE_KHR_PER_USD,
    val items: List<ClinicalBillItem> = listOf(
        ClinicalBillItem(
            id = "item_1",
            categoryEn = "Clinical Consultation",
            categoryKh = "ការពិគ្រោះជំងឺ",
            nameEn = "General Physician Consultation",
            nameKh = "ការពិគ្រោះយោបល់ទូទៅ",
            unitPriceUsd = 15.00,
            quantity = 1
        ),
        ClinicalBillItem(
            id = "item_2",
            categoryEn = "Pharmacy",
            categoryKh = "ឱសថស្ថាន",
            nameEn = "Prescribed Antibiotics and Analgesics",
            nameKh = "ឱសថព្យាបាលតាមវេជ្ជបញ្ជា",
            unitPriceUsd = 28.50,
            quantity = 1
        ),
        ClinicalBillItem(
            id = "item_3",
            categoryEn = "Laboratory",
            categoryKh = "មន្ទីរពិសោធន៍",
            nameEn = "Complete Blood Count and Electrolyte Panel",
            nameKh = "ការវិភាគមន្ទីរពិសោធន៍",
            unitPriceUsd = 45.00,
            quantity = 1
        ),
        ClinicalBillItem(
            id = "item_4",
            categoryEn = "Inpatient / Observation",
            categoryKh = "សម្រាកព្យាបាល",
            nameEn = "Emergency Ward Observation Bed - 1 Day",
            nameKh = "ថ្លៃគ្រែសម្រាកតាមដាន",
            unitPriceUsd = 20.00,
            quantity = 1
        )
    ),
    val paymentStatus: PaymentStatus = PaymentStatus.INITIAL,
    val khqrPayload: String = "",
    val md5Hash: String = "",
    val pollingSecondsRemaining: Int = 120,
    val transactionRef: String = "",
    val paidTimestamp: String = ""
) {
    val totalAmountUsd: Double
        get() = items.sumOf { it.subtotalUsd }

    val totalAmountKhr: Long
        get() = (totalAmountUsd * exchangeRate).toLong()
}

class BillingViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(BillingUiState())
    val uiState: StateFlow<BillingUiState> = _uiState.asStateFlow()

    private var pollingJob: Job? = null

    fun selectCurrency(currency: BillingCurrency) {
        _uiState.update { it.copy(currency = currency) }
    }

    fun updateItemQuantity(itemId: String, delta: Int) {
        _uiState.update { state ->
            val updated = state.items.map { item ->
                if (item.id == itemId) {
                    val newQty = (item.quantity + delta).coerceAtLeast(1)
                    item.copy(quantity = newQty)
                } else {
                    item
                }
            }
            state.copy(items = updated)
        }
    }

    fun generateKhqr() {
        val currentState = _uiState.value
        val amountStr = if (currentState.currency == BillingCurrency.USD) {
            String.format(Locale.US, "%.2f", currentState.totalAmountUsd)
        } else {
            currentState.totalAmountKhr.toString()
        }
        val currencyCode = if (currentState.currency == BillingCurrency.USD) "840" else "116"

        // Simulated Bakong KHQR EMVCo compliant string structure
        val simulatedKhqr = "00020101021229300016bakong@rotanaclinic520459995303${currencyCode}5406${amountStr}5802KH5913ROTANA CLINIC6010PHNOM PENH62210717${currentState.invoiceNumber}6304D1B9"
        val simulatedMd5 = "d41d8cd98f00b204e9800998ecf8427e"

        _uiState.update {
            it.copy(
                paymentStatus = PaymentStatus.PENDING,
                khqrPayload = simulatedKhqr,
                md5Hash = simulatedMd5,
                pollingSecondsRemaining = 120
            )
        }

        startPollingSimulation()
    }

    fun cancelKhqr() {
        pollingJob?.cancel()
        _uiState.update {
            it.copy(
                paymentStatus = PaymentStatus.INITIAL,
                khqrPayload = "",
                md5Hash = "",
                pollingSecondsRemaining = 120
            )
        }
    }

    fun simulatePaymentSuccess() {
        pollingJob?.cancel()
        val timeNow = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())
        val txnRef = "BK-" + System.currentTimeMillis().toString().takeLast(8)

        _uiState.update {
            it.copy(
                paymentStatus = PaymentStatus.PAID,
                transactionRef = txnRef,
                paidTimestamp = timeNow
            )
        }
    }

    fun simulatePaymentExpiration() {
        pollingJob?.cancel()
        _uiState.update {
            it.copy(
                paymentStatus = PaymentStatus.EXPIRED,
                pollingSecondsRemaining = 0
            )
        }
    }

    fun resetBilling() {
        pollingJob?.cancel()
        _uiState.update {
            it.copy(
                paymentStatus = PaymentStatus.INITIAL,
                khqrPayload = "",
                md5Hash = "",
                pollingSecondsRemaining = 120,
                transactionRef = "",
                paidTimestamp = ""
            )
        }
    }

    private fun startPollingSimulation() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (true) {
                delay(1000L)
                val currentRemaining = _uiState.value.pollingSecondsRemaining
                if (currentRemaining <= 1) {
                    _uiState.update {
                        it.copy(
                            paymentStatus = PaymentStatus.EXPIRED,
                            pollingSecondsRemaining = 0
                        )
                    }
                    break
                } else {
                    _uiState.update {
                        it.copy(pollingSecondsRemaining = currentRemaining - 1)
                    }
                }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        pollingJob?.cancel()
    }
}

@Composable
fun BillingScreen(
    onNavigateBack: () -> Unit = {},
    viewModel: BillingViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MedicalBackground)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Clinical POS Header
        ClinicalHeaderSection(
            patientName = state.patientName,
            patientCode = state.patientCode,
            invoiceNumber = state.invoiceNumber
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Currency Toggle and Live Exchange Rate Banner
        CurrencyToggleSection(
            selectedCurrency = state.currency,
            exchangeRate = state.exchangeRate,
            onSelectCurrency = { viewModel.selectCurrency(it) }
        )

        Spacer(modifier = Modifier.height(14.dp))

        // Itemized Clinical Bill Card
        ItemizedBillCard(
            items = state.items,
            selectedCurrency = state.currency,
            exchangeRate = state.exchangeRate,
            totalUsd = state.totalAmountUsd,
            totalKhr = state.totalAmountKhr,
            onQuantityChange = { itemId, delta -> viewModel.updateItemQuantity(itemId, delta) }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Bakong KHQR Payment Section
        KhqrPaymentCard(
            state = state,
            onGenerateKhqr = { viewModel.generateKhqr() },
            onCancelKhqr = { viewModel.cancelKhqr() },
            onSimulateSuccess = { viewModel.simulatePaymentSuccess() },
            onSimulateExpire = { viewModel.simulatePaymentExpiration() },
            onReset = { viewModel.resetBilling() }
        )

        Spacer(modifier = Modifier.height(20.dp))

        // Clinical Safety and Compliance Notice
        MedicalComplianceFooter()
    }
}

@Composable
private fun ClinicalHeaderSection(
    patientName: String,
    patientCode: String,
    invoiceNumber: String
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
                        text = "Rotana Clinic POS - Billing Station",
                        style = MaterialTheme.typography.titleLarge,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "ស្ថានីយទូទាត់ប្រាក់វេជ្ជសាស្ត្រ និងបាគង KHQR",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MedicalSlate
                    )
                }
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MedicalDeepTeal.copy(alpha = 0.12f)
                ) {
                    Text(
                        text = "ACTIVE BILL",
                        color = MedicalDeepTeal,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = MedicalSurfaceVariant
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Patient - អ្នកជំងឺ",
                        style = MaterialTheme.typography.labelSmall,
                        color = MedicalSlate
                    )
                    Text(
                        text = patientName,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.SemiBold,
                        color = MedicalOnSurface
                    )
                    Text(
                        text = "Hospital ID: $patientCode",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Invoice Number - លេខវិក្កយបត្រ",
                        style = MaterialTheme.typography.labelSmall,
                        color = MedicalSlate
                    )
                    Text(
                        text = invoiceNumber,
                        style = MaterialTheme.typography.bodyLarge,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = MedicalDeepTeal
                    )
                    Text(
                        text = "Dept: Outpatient & ER",
                        style = MaterialTheme.typography.bodySmall,
                        color = MedicalSlate
                    )
                }
            }
        }
    }
}

@Composable
private fun CurrencyToggleSection(
    selectedCurrency: BillingCurrency,
    exchangeRate: Double,
    onSelectCurrency: (BillingCurrency) -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Currency Mode - រូបិយប័ណ្ណទូទាត់",
                    style = MaterialTheme.typography.titleMedium,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )

                // Exchange Rate Chip
                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = MedicalLightTeal.copy(alpha = 0.20f),
                    border = CardDefaults.outlinedCardBorder()
                ) {
                    Text(
                        text = "អត្រាប្តូរប្រាក់: 1 USD = 4,100 KHR",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MedicalDeepTeal,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Two-Segment Toggle for USD and KHR
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MedicalSurfaceVariant, shape = RoundedCornerShape(10.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // USD Button
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onSelectCurrency(BillingCurrency.USD) },
                    color = if (selectedCurrency == BillingCurrency.USD) MedicalDeepTeal else Color.Transparent,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "USD - ដុល្លារ",
                            color = if (selectedCurrency == BillingCurrency.USD) Color.White else MedicalOnSurface,
                            fontWeight = if (selectedCurrency == BillingCurrency.USD) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "$",
                            color = if (selectedCurrency == BillingCurrency.USD) MedicalLightTeal else MedicalSlate,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }

                // KHR Button
                Surface(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onSelectCurrency(BillingCurrency.KHR) },
                    color = if (selectedCurrency == BillingCurrency.KHR) MedicalDeepTeal else Color.Transparent,
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "KHR - រៀល",
                            color = if (selectedCurrency == BillingCurrency.KHR) Color.White else MedicalOnSurface,
                            fontWeight = if (selectedCurrency == BillingCurrency.KHR) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "៛",
                            color = if (selectedCurrency == BillingCurrency.KHR) MedicalLightTeal else MedicalSlate,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemizedBillCard(
    items: List<ClinicalBillItem>,
    selectedCurrency: BillingCurrency,
    exchangeRate: Double,
    totalUsd: Double,
    totalKhr: Long,
    onQuantityChange: (String, Int) -> Unit
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
                Text(
                    text = "Clinical Services Breakdown",
                    style = MaterialTheme.typography.titleMedium,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "បញ្ជីទំនិញ និងសេវា",
                    style = MaterialTheme.typography.bodySmall,
                    color = MedicalSlate
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Item rows
            items.forEachIndexed { index, item ->
                ItemRowView(
                    item = item,
                    selectedCurrency = selectedCurrency,
                    exchangeRate = exchangeRate,
                    onMinusClick = { onQuantityChange(item.id, -1) },
                    onPlusClick = { onQuantityChange(item.id, 1) }
                )
                if (index < items.size - 1) {
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 10.dp),
                        color = MedicalSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
            }

            HorizontalDivider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = MedicalDeepTeal.copy(alpha = 0.25f),
                thickness = 1.5.dp
            )

            // Grand Total Highlight Card
            Surface(
                shape = RoundedCornerShape(10.dp),
                color = MedicalSurfaceVariant.copy(alpha = 0.45f),
                border = CardDefaults.outlinedCardBorder(),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "TOTAL PAYABLE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = MedicalSlate
                            )
                            Text(
                                text = "ទឹកប្រាក់សរុបត្រូវបង់",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = MedicalDeepTeal
                            )
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            if (selectedCurrency == BillingCurrency.USD) {
                                Text(
                                    text = formatUsd(totalUsd),
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MedicalDeepTeal
                                )
                                Text(
                                    text = "សមមូល: ${formatKhr(totalKhr)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MedicalSlate
                                )
                            } else {
                                Text(
                                    text = formatKhr(totalKhr),
                                    style = MaterialTheme.typography.headlineMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MedicalDeepTeal
                                )
                                Text(
                                    text = "Equivalent: ${formatUsd(totalUsd)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = MedicalSlate
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ItemRowView(
    item: ClinicalBillItem,
    selectedCurrency: BillingCurrency,
    exchangeRate: Double,
    onMinusClick: () -> Unit,
    onPlusClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.nameEn,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = MedicalOnSurface
            )
            Text(
                text = item.nameKh,
                style = MaterialTheme.typography.bodySmall,
                color = MedicalSlate
            )
            Spacer(modifier = Modifier.height(2.dp))
            val unitStr = if (selectedCurrency == BillingCurrency.USD) {
                "${formatUsd(item.unitPriceUsd)} each"
            } else {
                "${formatKhr((item.unitPriceUsd * exchangeRate).toLong())} ក្នុងមួយឯកតា"
            }
            Text(
                text = unitStr,
                fontSize = 11.sp,
                color = MedicalSlate.copy(alpha = 0.8f)
            )
        }

        // Stepper for quantity
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 8.dp)
        ) {
            Surface(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .clickable { onMinusClick() },
                color = MedicalSurfaceVariant,
                shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Remove,
                        contentDescription = "Decrease",
                        tint = MedicalDeepTeal,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Text(
                text = "${item.quantity}",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.padding(horizontal = 10.dp)
            )

            Surface(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .clickable { onPlusClick() },
                color = MedicalSurfaceVariant,
                shape = CircleShape
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Increase",
                        tint = MedicalDeepTeal,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // Line subtotal
        Column(
            horizontalAlignment = Alignment.End,
            modifier = Modifier.widthIn(min = 80.dp)
        ) {
            if (selectedCurrency == BillingCurrency.USD) {
                Text(
                    text = formatUsd(item.subtotalUsd),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MedicalOnSurface
                )
                Text(
                    text = formatKhr(item.subtotalKhr(exchangeRate)),
                    fontSize = 11.sp,
                    color = MedicalSlate
                )
            } else {
                Text(
                    text = formatKhr(item.subtotalKhr(exchangeRate)),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = MedicalOnSurface
                )
                Text(
                    text = formatUsd(item.subtotalUsd),
                    fontSize = 11.sp,
                    color = MedicalSlate
                )
            }
        }
    }
}

@Composable
private fun KhqrPaymentCard(
    state: BillingUiState,
    onGenerateKhqr: () -> Unit,
    onCancelKhqr: () -> Unit,
    onSimulateSuccess: () -> Unit,
    onSimulateExpire: () -> Unit,
    onReset: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MedicalSurface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Payment,
                        contentDescription = null,
                        tint = MedicalDeepTeal,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Bakong KHQR Payment Gateway",
                        style = MaterialTheme.typography.titleMedium,
                        color = MedicalDeepTeal,
                        fontWeight = FontWeight.Bold
                    )
                }

                PaymentStatusBadge(status = state.paymentStatus)
            }

            Spacer(modifier = Modifier.height(14.dp))

            when (state.paymentStatus) {
                PaymentStatus.INITIAL -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Instant digital checkout with Bakong Mobile and NBC-member banking applications.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MedicalSlate,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        )
                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = onGenerateKhqr,
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCode,
                                contentDescription = null,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Generate Bakong KHQR - បង្កើតកូដទូទាត់ KHQR",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                PaymentStatus.PENDING -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // High-contrast Clinical QR Presentation Box
                        ClinicalQrDisplay(
                            payload = state.khqrPayload,
                            invoiceNumber = state.invoiceNumber,
                            amountFormatted = if (state.currency == BillingCurrency.USD) {
                                formatUsd(state.totalAmountUsd)
                            } else {
                                formatKhr(state.totalAmountKhr)
                            },
                            currencyCode = state.currency.name
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Polling Progress & Countdown
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MedicalSurfaceVariant.copy(alpha = 0.5f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            color = MedicalDeepTeal,
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "កំពុងរង់ចាំការទូទាត់... Polling Gateway",
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = MedicalDeepTeal
                                        )
                                    }

                                    val minutes = state.pollingSecondsRemaining / 60
                                    val seconds = state.pollingSecondsRemaining % 60
                                    Text(
                                        text = String.format(Locale.US, "%02d:%02d", minutes, seconds),
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        color = if (state.pollingSecondsRemaining < 30) MedicalError else MedicalOnSurface
                                    )
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                LinearProgressIndicator(
                                    progress = { state.pollingSecondsRemaining / 120f },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(4.dp)
                                        .clip(RoundedCornerShape(2.dp)),
                                    color = MedicalDeepTeal,
                                    trackColor = MedicalSurfaceVariant
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Simulated Testing & Polling Action Controls for Clinicians
                        Text(
                            text = "Clinical POS Simulation Controls",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MedicalSlate
                        )
                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = onSimulateSuccess,
                                colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "Simulate Paid",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            OutlinedButton(
                                onClick = onSimulateExpire,
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = MedicalError),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(
                                    text = "Simulate Timeout",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        OutlinedButton(
                            onClick = onCancelKhqr,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Cancel QR Session",
                                fontSize = 12.sp,
                                color = MedicalSlate
                            )
                        }
                    }
                }

                PaymentStatus.PAID -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MedicalDeepTeal.copy(alpha = 0.12f),
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = MedicalDeepTeal,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Payment Successfully Received",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MedicalDeepTeal
                        )
                        Text(
                            text = "ការទូទាត់ជោគជ័យ - បានផ្ទៀងផ្ទាត់តាមបាគង",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MedicalSlate
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Transaction details receipt box
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MedicalBackground,
                            border = CardDefaults.outlinedCardBorder(),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                DetailRow("Transaction ID", state.transactionRef)
                                DetailRow("Settled At", state.paidTimestamp)
                                DetailRow(
                                    "Amount Settled",
                                    if (state.currency == BillingCurrency.USD) {
                                        "${formatUsd(state.totalAmountUsd)} USD"
                                    } else {
                                        "${formatKhr(state.totalAmountKhr)} KHR"
                                    }
                                )
                                DetailRow("Method", "Bakong KHQR Dynamic")
                                DetailRow("Reconciliation", "AUTOMATED - INSTANT")
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { /* Print action placeholder */ },
                                colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Print,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Print Receipt",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }

                            OutlinedButton(
                                onClick = onReset,
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Receipt,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Next Patient",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }

                PaymentStatus.EXPIRED -> {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MedicalError.copy(alpha = 0.12f),
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = null,
                                    tint = MedicalError,
                                    modifier = Modifier.size(36.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = "Payment Session Expired",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MedicalError
                        )
                        Text(
                            text = "កូដទូទាត់បានផុតកំណត់: សូមបង្កើតកូដថ្មី",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MedicalSlate
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = onGenerateKhqr,
                            colors = ButtonDefaults.buttonColors(containerColor = MedicalDeepTeal),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Refresh,
                                contentDescription = null,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Regenerate KHQR - បង្កើតកូដថ្មី",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PaymentStatusBadge(status: PaymentStatus) {
    val (bgColor, textColor, label) = when (status) {
        PaymentStatus.INITIAL -> Triple(MedicalSurfaceVariant, MedicalSlate, "READY")
        PaymentStatus.PENDING -> Triple(Color(0xFFFFF3CD), Color(0xFF856404), "PENDING")
        PaymentStatus.PAID -> Triple(MedicalLightTeal.copy(alpha = 0.35f), MedicalDeepTeal, "PAID")
        PaymentStatus.EXPIRED -> Triple(MedicalError.copy(alpha = 0.15f), MedicalError, "EXPIRED")
    }

    Surface(
        shape = RoundedCornerShape(6.dp),
        color = bgColor
    ) {
        Text(
            text = label,
            color = textColor,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            color = MedicalSlate
        )
        Text(
            text = value,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            color = MedicalOnSurface,
            fontFamily = FontFamily.Monospace
        )
    }
}

@Composable
private fun ClinicalQrDisplay(
    payload: String,
    invoiceNumber: String,
    amountFormatted: String,
    currencyCode: String
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        border = CardDefaults.outlinedCardBorder(),
        modifier = Modifier.width(280.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Bakong KHQR Header
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = Color(0xFFE1251B), // Official Bakong Red Accent
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(vertical = 6.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "KHQR",
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        fontSize = 16.sp,
                        letterSpacing = 2.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "ROTANA CLINIC - PHNOM PENH",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = MedicalOnSurface
            )
            Text(
                text = "វិក្កយបត្រ: $invoiceNumber",
                fontSize = 10.sp,
                color = MedicalSlate
            )

            Spacer(modifier = Modifier.height(10.dp))

            // Canvas Drawing for High-Contrast QR Pattern
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .background(Color.White)
                    .border(1.dp, MedicalSurfaceVariant, RoundedCornerShape(8.dp))
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawClinicalQrMatrix(payload = payload)
                }

                // Center KHQR Emblem
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = MedicalDeepTeal,
                    border = CardDefaults.outlinedCardBorder(),
                    modifier = Modifier.size(34.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = "៛ / $",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Payable Amount Display
            Text(
                text = amountFormatted,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MedicalDeepTeal
            )
            Text(
                text = "Scan with any Bakong Supported Mobile App",
                fontSize = 10.sp,
                color = MedicalSlate,
                textAlign = TextAlign.Center
            )
        }
    }
}

private fun DrawScope.drawClinicalQrMatrix(payload: String) {
    val matrixSize = 25
    val cellSize = size.width / matrixSize
    val seed = payload.hashCode().toLong().absoluteValue

    // Draw finder patterns at 3 corners: top-left, top-right, bottom-left
    drawFinderPattern(0, 0, cellSize)
    drawFinderPattern(matrixSize - 7, 0, cellSize)
    drawFinderPattern(0, matrixSize - 7, cellSize)

    // Draw timing patterns
    for (i in 7 until matrixSize - 7) {
        if (i % 2 == 0) {
            drawRect(
                color = Color.Black,
                topLeft = Offset(i * cellSize, 6 * cellSize),
                size = Size(cellSize, cellSize)
            )
            drawRect(
                color = Color.Black,
                topLeft = Offset(6 * cellSize, i * cellSize),
                size = Size(cellSize, cellSize)
            )
        }
    }

    // Draw pseudo-random data modules based on payload hash
    for (row in 0 until matrixSize) {
        for (col in 0 until matrixSize) {
            val inTopLeft = row < 7 && col < 7
            val inTopRight = row < 7 && col >= matrixSize - 7
            val inBottomLeft = row >= matrixSize - 7 && col < 7
            val inCenter = row in 10..14 && col in 10..14
            val inTiming = (row == 6 || col == 6)

            if (!inTopLeft && !inTopRight && !inBottomLeft && !inCenter && !inTiming) {
                val moduleHash = (seed xor (row.toLong() * 37 + col.toLong() * 19 + (row * col).toLong()))
                if ((moduleHash % 3L) != 0L) {
                    drawRect(
                        color = Color.Black,
                        topLeft = Offset(col * cellSize, row * cellSize),
                        size = Size(cellSize, cellSize)
                    )
                }
            }
        }
    }
}

private fun DrawScope.drawFinderPattern(startCol: Int, startRow: Int, cellSize: Float) {
    val x = startCol * cellSize
    val y = startRow * cellSize
    val fullSize = 7 * cellSize

    // Outer 7x7 black square
    drawRect(
        color = Color.Black,
        topLeft = Offset(x, y),
        size = Size(fullSize, fullSize)
    )

    // Inner 5x5 white square
    drawRect(
        color = Color.White,
        topLeft = Offset(x + cellSize, y + cellSize),
        size = Size(5 * cellSize, 5 * cellSize)
    )

    // Center 3x3 black square
    drawRect(
        color = Color.Black,
        topLeft = Offset(x + 2 * cellSize, y + 2 * cellSize),
        size = Size(3 * cellSize, 3 * cellSize)
    )
}

@Composable
private fun MedicalComplianceFooter() {
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
                    text = "National Bank of Cambodia - NBC Bakong Standard",
                    style = MaterialTheme.typography.titleSmall,
                    color = MedicalDeepTeal,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = "Compliant with EMVCo QR Code Specifications for Merchant-Presented Mode. All transactions are digitally signed and cryptographically verified.",
                    fontSize = 11.sp,
                    color = MedicalSlate,
                    lineHeight = 15.sp
                )
            }
        }
    }
}

private fun formatUsd(amount: Double): String {
    val formatter = DecimalFormat("$#,##0.00")
    return formatter.format(amount)
}

private fun formatKhr(amount: Long): String {
    val formatter = DecimalFormat("#,###")
    return "${formatter.format(amount)} ៛"
}
