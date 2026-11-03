package com.krupet.clinic.core.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged

enum class ConnectivityStatus {
    AVAILABLE,
    UNAVAILABLE,
    LOSING,
    LOST,
    CELLULAR_METERED
}

interface ConnectivityObserver {
    fun observe(): Flow<ConnectivityStatus>
    fun getCurrentStatus(): ConnectivityStatus
}

class NetworkConnectivityObserver(
    private val context: Context
) : ConnectivityObserver {

    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    override fun observe(): Flow<ConnectivityStatus> {
        return callbackFlow {
            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    super.onAvailable(network)
                    val status = evaluateNetworkStatus(network)
                    trySend(status)
                }

                override fun onLosing(network: Network, maxMsToLive: Int) {
                    super.onLosing(network, maxMsToLive)
                    trySend(ConnectivityStatus.LOSING)
                }

                override fun onLost(network: Network) {
                    super.onLost(network)
                    trySend(ConnectivityStatus.LOST)
                }

                override fun onUnavailable() {
                    super.onUnavailable()
                    trySend(ConnectivityStatus.UNAVAILABLE)
                }

                override fun onCapabilitiesChanged(
                    network: Network,
                    networkCapabilities: NetworkCapabilities
                ) {
                    super.onCapabilitiesChanged(network, networkCapabilities)
                    val status = evaluateCapabilities(networkCapabilities)
                    trySend(status)
                }
            }

            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            connectivityManager.registerNetworkCallback(request, callback)

            // Emit initial status
            trySend(getCurrentStatus())

            awaitClose {
                connectivityManager.unregisterNetworkCallback(callback)
            }
        }.distinctUntilChanged()
    }

    override fun getCurrentStatus(): ConnectivityStatus {
        val activeNetwork = connectivityManager.activeNetwork ?: return ConnectivityStatus.UNAVAILABLE
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork)
            ?: return ConnectivityStatus.UNAVAILABLE

        return evaluateCapabilities(capabilities)
    }

    private fun evaluateNetworkStatus(network: Network): ConnectivityStatus {
        val capabilities = connectivityManager.getNetworkCapabilities(network)
            ?: return ConnectivityStatus.AVAILABLE
        return evaluateCapabilities(capabilities)
    }

    private fun evaluateCapabilities(capabilities: NetworkCapabilities): ConnectivityStatus {
        val hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        if (!hasInternet) {
            return ConnectivityStatus.UNAVAILABLE
        }

        val isCellular = capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
        val isNotMetered = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)

        return if (isCellular && !isNotMetered) {
            ConnectivityStatus.CELLULAR_METERED
        } else {
            ConnectivityStatus.AVAILABLE
        }
    }
}
