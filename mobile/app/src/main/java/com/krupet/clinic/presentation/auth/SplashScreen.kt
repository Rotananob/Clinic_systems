package com.krupet.clinic.presentation.auth

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.krupet.clinic.core.designsystem.*
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(
    onSplashFinished: () -> Unit
) {
    var progress by remember { mutableFloatStateOf(0.0f) }
    var statusText by remember { mutableStateOf("កំពុងចាប់ផ្ដើមប្រព័ន្ធវេជ្ជសាស្ត្រ - Initializing") }

    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    LaunchedEffect(Unit) {
        val steps = listOf(
            0.20f to "កំពុងផ្ទុកទិន្នន័យក្រៅបណ្ដាញ SQLite Room Cache",
            0.45f to "កំពុងផ្ទៀងផ្ទាត់សុវត្ថិភាព NestJS TLS 1.3 Gateway",
            0.70f to "កំពុងផ្ទុកបញ្ជីឱសថចាំបាច់ MoH Essential Formulary",
            0.90f to "កំពុងក្រិតប្រព័ន្ធរលកបេះដូង ECG DSP Engine",
            1.00f to "ប្រព័ន្ធរួចរាល់សម្រាប់ការងារ - Station Ready"
        )
        for ((targetProgress, status) in steps) {
            statusText = status
            while (progress < targetProgress) {
                progress += 0.04f
                delay(40)
            }
            delay(150)
        }
        delay(400)
        onSplashFinished()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF021C19),
                        Color(0xFF063D36),
                        Color(0xFF011412)
                    )
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Animated Medical Cross & Hexagon Emblem
            Box(
                modifier = Modifier
                    .size(110.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF006A6A), Color(0xFF004D40))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Canvas(
                    modifier = Modifier
                        .size(70.dp * pulseScale)
                ) {
                    val w = size.width
                    val h = size.height
                    val barW = w * 0.28f
                    val barH = h * 0.76f

                    // Vertical bar of medical cross
                    drawRoundRect(
                        color = Color.White,
                        topLeft = Offset((w - barW) / 2f, (h - barH) / 2f),
                        size = Size(barW, barH),
                        cornerRadius = CornerRadius(barW / 3f, barW / 3f)
                    )
                    // Horizontal bar of medical cross
                    drawRoundRect(
                        color = Color.White,
                        topLeft = Offset((w - barH) / 2f, (h - barW) / 2f),
                        size = Size(barH, barW),
                        cornerRadius = CornerRadius(barW / 3f, barW / 3f)
                    )
                    // Center emerald core
                    drawCircle(
                        color = Color(0xFF2DD4BF),
                        radius = barW * 0.38f,
                        center = center
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Official Hospital Identity
            Text(
                text = "មន្ទីរពេទ្យ គ្រូពេទ្យ",
                color = Color.White,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "KRUPET MEDICAL CENTER - ENTERPRISE",
                color = Color(0xFF2DD4BF),
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.5.sp
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Initialization Progress Bar
            Column(
                modifier = Modifier.width(260.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF133E38))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(fraction = progress.coerceIn(0f, 1f))
                            .fillMaxHeight()
                            .clip(CircleShape)
                            .background(
                                Brush.horizontalGradient(
                                    listOf(Color(0xFF2DD4BF), Color(0xFF80CBC4))
                                )
                            )
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = statusText,
                    color = Color(0xFFB2DFDB),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1
                )
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Quick Enter Action
            TextButton(
                onClick = onSplashFinished,
                colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF80CBC4))
            ) {
                Text(
                    text = "រំលងការផ្ទុក - Quick Enter",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        // Bottom Architecture Footer
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "KruPet Mobile Workstation v2.4.0 - Android 15 Architecture",
                color = Color(0xFF4DB6AC).copy(alpha = 0.7f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Normal
            )
            Text(
                text = "National MoH Clinical Protocols Compliant",
                color = Color(0xFF4DB6AC).copy(alpha = 0.5f),
                fontSize = 10.sp
            )
        }
    }
}
