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

# Preserve Medical Domain Entities, Room Models & Math Engines
-keep class com.krupet.clinic.core.math.** { *; }
-keep class com.krupet.clinic.domain.model.** { *; }
-keep class com.krupet.clinic.data.remote.** { *; }
-keep class com.krupet.mobile.data.local.entity.** { *; }
-keep class com.krupet.mobile.data.local.dao.** { *; }
-keep class com.krupet.mobile.data.local.KruPetDatabase { *; }
-keep class com.krupet.mobile.data.repository.** { *; }

# Room Database Runtime Invariants
-dontwarn androidx.room.paging.**
-keep class * extends androidx.room.RoomDatabase
-keepclassmembers class * extends androidx.room.RoomDatabase {
    <methods>;
}

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

# Strip non-critical logcat output in release builds to protect PHI
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
