package dev.rinzai.zen.liveactivity

import android.Manifest
import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.ContextWrapper
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.result.ActivityResultRegistryOwner
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import dev.rinzai.zen.Zen
import java.util.concurrent.atomic.AtomicInteger

private const val CHANNEL = "dev.rinzai.zen.live"
// Above the media notification's id (0x5a454e), so the two never meet.
private val ids = AtomicInteger(0x5a4600)
// A progress bar's whole, in the steps the system's bar takes.
private const val WHOLE = 1000

private tailrec fun Context.activity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.activity()
    else -> null
}

@Composable
internal actual fun rememberPlatformLiveActivities(): PlatformLiveActivities? {
    val context = LocalContext.current
    val accent = Zen.tokens.primary.color().toArgb()
    return remember(context, accent) { AndroidLiveActivities(context, accent) }
}

/**
 * Live Updates: an ongoing notification the system promotes (Android 16) to the status bar chip
 * and the top of the lock screen and shade, in ProgressStyle; before Android 16, the same
 * notification with a plain progress bar.
 */
private class AndroidLiveActivities(private val context: Context, private val accent: Int) : PlatformLiveActivities {
    private val app = context.applicationContext
    private val notifications = app.getSystemService(NotificationManager::class.java)

    override val permitted: Boolean
        get() = notifications.areNotificationsEnabled() &&
            (Build.VERSION.SDK_INT < 33 || app.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)

    override fun requestPermission(onResult: (Boolean) -> Unit) {
        if (Build.VERSION.SDK_INT < 33) return onResult(permitted)
        val registry = (context.activity() as? ActivityResultRegistryOwner)?.activityResultRegistry ?: return onResult(false)
        var launcher: androidx.activity.result.ActivityResultLauncher<String>? = null
        launcher = registry.register("zen-live-permission-" + System.identityHashCode(this), ActivityResultContracts.RequestPermission()) {
            launcher?.unregister()
            onResult(permitted)
        }
        launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }

    override fun start(content: LiveActivityContent): LiveActivityHandle {
        notifications.createNotificationChannel(
            // Low: it updates often and shouldn't sound; the system still promotes it (only Min can't be).
            NotificationChannel(CHANNEL, "Live activity", NotificationManager.IMPORTANCE_LOW).apply { setShowBadge(false) },
        )
        val id = ids.incrementAndGet()
        val handle = object : LiveActivityHandle {
            override fun update(content: LiveActivityContent) {
                if (permitted) notifications.notify(id, build(content))
            }
            override fun end() = notifications.cancel(id)
        }
        handle.update(content)
        return handle
    }

    private fun build(content: LiveActivityContent): Notification {
        val open = app.packageManager.getLaunchIntentForPackage(app.packageName)?.let {
            PendingIntent.getActivity(app, 0, it, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        }
        val b = Notification.Builder(app, CHANNEL)
            .setSmallIcon(app.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_dialog_info)
            .setContentTitle(content.title)
            .setContentText(content.text)
            .setContentIntent(open)
            .setColor(accent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setCategory(Notification.CATEGORY_PROGRESS)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
        content.endsAt?.let { b.setWhen(it).setShowWhen(true).setUsesChronometer(true).setChronometerCountDown(true) }
        val step = { f: Float -> (f.coerceIn(0f, 1f) * WHOLE).toInt() }
        if (Build.VERSION.SDK_INT >= 36) {
            // The extra, not setRequestPromotedOngoing (36.1 on): Android 16.0 has only this. A constant, so inlined.
            b.extras.putBoolean(Notification.EXTRA_REQUEST_PROMOTED_ONGOING, true)
            content.chip?.let(b::setShortCriticalText)
            if (content.progress != null || content.stops.isNotEmpty()) {
                b.setStyle(
                    Notification.ProgressStyle()
                        .setProgressSegments(listOf(Notification.ProgressStyle.Segment(WHOLE).setColor(accent)))
                        .setProgressPoints(content.stops.map(step).filter { it in 1 until WHOLE }.map { Notification.ProgressStyle.Point(it).setColor(accent) })
                        .setProgress(step(content.progress ?: 0f)),
                )
            }
        } else {
            content.progress?.let { b.setProgress(WHOLE, step(it), false) }
            content.chip?.let(b::setSubText)
        }
        return b.build()
    }
}
