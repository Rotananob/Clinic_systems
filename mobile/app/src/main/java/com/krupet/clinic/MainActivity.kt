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
import com.krupet.clinic.presentation.pediatric.PediatricScreen
import com.krupet.clinic.presentation.resuscitation.ResuscitationScreen

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
                                label = { Text("Dashboard") },
                                icon = { Text("DB") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "resuscitation",
                                onClick = { navController.navigate("resuscitation") },
                                label = { Text("Resus") },
                                icon = { Text("ER") }
                            )
                            NavigationBarItem(
                                selected = currentRoute == "pediatric",
                                onClick = { navController.navigate("pediatric") },
                                label = { Text("Pediatric") },
                                icon = { Text("PD") }
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
                                onNavigateToBilling = { navController.navigate("billing") }
                            )
                        }
                        composable("resuscitation") {
                            ResuscitationScreen()
                        }
                        composable("pediatric") {
                            PediatricScreen()
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
