package com.krupet.clinic

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.krupet.clinic.core.designsystem.*
import com.krupet.clinic.presentation.auth.LoginScreen
import com.krupet.clinic.presentation.auth.OnboardingScreen
import com.krupet.clinic.presentation.auth.SplashScreen
import com.krupet.clinic.presentation.billing.BillingScreen
import com.krupet.clinic.presentation.dashboard.DashboardScreen
import com.krupet.clinic.presentation.dental.DentalScreen
import com.krupet.clinic.presentation.eclaim.NssfClaimScreen
import com.krupet.clinic.presentation.laboratory.LabScreen
import com.krupet.clinic.presentation.narcotics.NarcoticsRegisterScreen
import com.krupet.clinic.presentation.pacs.PacsViewerScreen
import com.krupet.clinic.presentation.patient.PatientScreen
import com.krupet.clinic.presentation.pediatric.PediatricScreen
import com.krupet.clinic.presentation.resuscitation.ResuscitationScreen
import com.krupet.clinic.presentation.stewardship.AntimicrobialStewardshipScreen
import com.krupet.clinic.presentation.surgical.SurgicalChecklistScreen
import com.krupet.clinic.presentation.teleconsult.TeleconsultScreen
import com.krupet.clinic.presentation.telemetry.BedsideTelemetryScreen
import com.krupet.clinic.presentation.triage.TriageScreen
import com.krupet.clinic.presentation.ward.WardBedScreen
import com.krupet.clinic.presentation.warehouse.WarehouseInventoryScreen

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KruPetTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: "splash"

                val showBottomBar = currentRoute in listOf("dashboard", "triage", "patient", "ward", "billing")

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        if (showBottomBar) {
                            NavigationBar(
                                containerColor = MedicalSurface,
                                tonalElevation = 6.dp,
                                modifier = Modifier.border(1.dp, MedicalBorder)
                            ) {
                                NavigationBarItem(
                                    selected = currentRoute == "dashboard",
                                    onClick = {
                                        navController.navigate("dashboard") {
                                            popUpTo("dashboard") { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    label = { Text("Hub", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                    icon = { Icon(Icons.Default.Home, contentDescription = "Hub", tint = if (currentRoute == "dashboard") MedicalDeepTeal else MedicalSlate) }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "triage",
                                    onClick = {
                                        navController.navigate("triage") {
                                            popUpTo("dashboard") { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    label = { Text("ESI", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                    icon = { Icon(Icons.Default.Warning, contentDescription = "Triage", tint = if (currentRoute == "triage") AcuityEsi1Resus else MedicalSlate) }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "patient",
                                    onClick = {
                                        navController.navigate("patient") {
                                            popUpTo("dashboard") { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    label = { Text("EHR", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                    icon = { Icon(Icons.Default.Person, contentDescription = "Patients", tint = if (currentRoute == "patient") MedicalDeepTeal else MedicalSlate) }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "ward",
                                    onClick = {
                                        navController.navigate("ward") {
                                            popUpTo("dashboard") { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    label = { Text("Ward", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                    icon = { Icon(Icons.Default.LocalHospital, contentDescription = "Ward Beds", tint = if (currentRoute == "ward") Color(0xFF1E6B37) else MedicalSlate) }
                                )
                                NavigationBarItem(
                                    selected = currentRoute == "billing",
                                    onClick = {
                                        navController.navigate("billing") {
                                            popUpTo("dashboard") { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    },
                                    label = { Text("POS", fontSize = 11.sp, fontWeight = FontWeight.Bold) },
                                    icon = { Icon(Icons.Default.Payment, contentDescription = "Bakong Billing", tint = if (currentRoute == "billing") BankBakongRed else MedicalSlate) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "splash",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("splash") {
                            SplashScreen(
                                onSplashFinished = {
                                    navController.navigate("onboarding") {
                                        popUpTo("splash") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("onboarding") {
                            OnboardingScreen(
                                onDutyConfirmed = {
                                    navController.navigate("dashboard") {
                                        popUpTo("onboarding") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("dashboard") {
                            DashboardScreen(
                                onNavigateToResus = { navController.navigate("resuscitation") },
                                onNavigateToPediatric = { navController.navigate("pediatric") },
                                onNavigateToBilling = { navController.navigate("billing") },
                                onNavigateToTriage = { navController.navigate("triage") },
                                onNavigateToWard = { navController.navigate("ward") },
                                onNavigateToPacs = { navController.navigate("pacs") },
                                onNavigateToTeleconsult = { navController.navigate("teleconsult") },
                                onNavigateToLab = { navController.navigate("lab") },
                                onNavigateToDental = { navController.navigate("dental") },
                                onNavigateToTelemetry = { navController.navigate("telemetry") },
                                onNavigateToPatient = { navController.navigate("patient") },
                                onNavigateToStewardship = { navController.navigate("stewardship") },
                                onNavigateToSurgical = { navController.navigate("surgical") },
                                onNavigateToNarcotics = { navController.navigate("narcotics") },
                                onNavigateToWarehouse = { navController.navigate("warehouse") },
                                onNavigateToNssf = { navController.navigate("nssf_claim") }
                            )
                        }
                        composable("login") {
                            LoginScreen(
                                onLoginSuccess = { navController.navigate("dashboard") }
                            )
                        }
                        composable("triage") {
                            TriageScreen(onNavigateBack = { navController.popBackStack() })
                        }
                        composable("resuscitation") {
                            ResuscitationScreen()
                        }
                        composable("pediatric") {
                            PediatricScreen()
                        }
                        composable("telemetry") {
                            BedsideTelemetryScreen()
                        }
                        composable("surgical") {
                            SurgicalChecklistScreen()
                        }
                        composable("stewardship") {
                            AntimicrobialStewardshipScreen()
                        }
                        composable("narcotics") {
                            NarcoticsRegisterScreen()
                        }
                        composable("warehouse") {
                            WarehouseInventoryScreen()
                        }
                        composable("ward") {
                            WardBedScreen()
                        }
                        composable("pacs") {
                            PacsViewerScreen()
                        }
                        composable("lab") {
                            LabScreen()
                        }
                        composable("dental") {
                            DentalScreen()
                        }
                        composable("teleconsult") {
                            TeleconsultScreen()
                        }
                        composable("patient") {
                            PatientScreen(
                                onNavigateToTriage = { navController.navigate("triage") },
                                onNavigateToBilling = { navController.navigate("billing") }
                            )
                        }
                        composable("billing") {
                            BillingScreen()
                        }
                        composable("nssf_claim") {
                            NssfClaimScreen(
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }
}
