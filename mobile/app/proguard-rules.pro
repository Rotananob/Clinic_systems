# KruPet Clinical Mobile Platform - R8 ProGuard Configuration
# Medical Safety Invariant: Never strip or obfuscate clinical math models, serialization schemas, or API contracts

# Preserve Kotlin Serialization
-keepattributes *Annotation*,InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keepclassmembers class * {
    @kotlinx.serialization.SerialName <fields>;
}

# Preserve Medical Domain Entities & Math DTOs
-keep class com.krupet.clinic.domain.model.** { *; }
-keep class com.krupet.clinic.data.remote.** { *; }

# Preserve Retrofit and OkHttp Reflection
-dontwarn okio.**
-dontwarn retrofit2.Platform$Java8
-keepattributes Signature
-keepattributes Exceptions
-keepclassmembers,allowshrinking,allowoptimization interface * {
    @retrofit2.http.* <methods>;
}

# Material 3 and Compose Stability
-keep class androidx.compose.material3.** { *; }
