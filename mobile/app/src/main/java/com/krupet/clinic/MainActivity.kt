package com.krupet.clinic

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.krupet.clinic.core.designsystem.KruPetTheme
import com.krupet.clinic.presentation.billing.BillingScreen
import com.krupet.clinic.presentation.dashboard.DashboardScreen
import com.krupet.clinic.presentation.dental.DentalScreen
import com.krupet.clinic.presentation.laboratory.LabScreen
import com.krupet.clinic.presentation.pacs.PacsViewerScreen
import com.krupet.clinic.presentation.patient.PatientScreen
import com.krupet.clinic.presentation.pediatric.PediatricScreen
import com.krupet.clinic.presentation.resuscitation.ResuscitationScreen
import com.krupet.clinic.presentation.teleconsult.TeleconsultScreen
import com.krupet.clinic.presentation.telemetry.BedsideTelemetryScreen
import com.krupet.clinic.presentation.triage.TriageScreen
import com.krupet.clinic.presentation.ward.WardBedScreen

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KruPetTheme {
                val navController = rememberNavController()
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentRoute = navBackStackEntry?.destination?.route ?: "dashboard"

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    bottomBar = {
                        NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                            NavigationBarItem(
                                selected = currentRoute == "dashboard",
                                onClick = { navController.navigate("dashboard") },
                                label = { Text("Hub") },
                                icon = { Text("HUB") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "triage",
                                onClick = { navController.navigate("triage") },
                                label = { Text("Triage") },
                                icon = { Text("ESI") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "patient",
                                onClick = { navController.navigate("patient") },
                                label = { Text("EHR") },
                                icon = { Text("EHR") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "ward",
                                onClick = { navController.navigate("ward") },
                                label = { Text("Ward") },
                                icon = { Text("BED") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "billing",
                                onClick = { navController.navigate("billing") },
                                label = { Text("Billing") },
                                icon = { Text("POS") }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "dashboard",
                        modifier = Modifier.padding(innerPadding)
                    ) {
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
                                onNavigateToPatient = { navController.navigate("patient") }
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
                    }
                }
            }
        }
    }
}
