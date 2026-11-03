package com.krupet.clinic.core.network

import com.krupet.clinic.data.remote.ClinicApiService
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import java.util.concurrent.TimeUnit

object ApiClient {

    // Default Android emulator loopback to host NestJS backend (Port 3001)
    // For physical device testing, dynamically reconfigure to local Wi-Fi IP (e.g. 192.168.1.X)
    private var baseUrl: String = "http://10.0.2.2:3001/api/"
    private var authToken: String? = null

    fun setBaseUrl(url: String) {
        baseUrl = if (url.endsWith("/")) url else "$url/"
        retrofitInstance = null
    }

    fun setAuthToken(token: String?) {
        authToken = token
    }

    private val authInterceptor = Interceptor { chain ->
        val originalRequest = chain.request()
        val requestBuilder = originalRequest.newBuilder()

        authToken?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }

        requestBuilder.header("Content-Type", "application/json")
        requestBuilder.header("Accept", "application/json")
        chain.proceed(requestBuilder.build())
    }

    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .build()
    }

    private var retrofitInstance: Retrofit? = null

    val service: ClinicApiService
        get() {
            if (retrofitInstance == null) {
                retrofitInstance = Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(okHttpClient)
                    .build()
            }
            return retrofitInstance!!.create(ClinicApiService::class.java)
        }
}
