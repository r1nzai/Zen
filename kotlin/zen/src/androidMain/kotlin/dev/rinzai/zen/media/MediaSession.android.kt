package dev.rinzai.zen.media

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.media.MediaMetadata
import android.media.session.MediaSession as AndroidSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.SystemClock
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.platform.LocalContext

@Composable
internal actual fun rememberPlatformMediaSession(): PlatformMediaSession? {
    val context = LocalContext.current.applicationContext
    val session = remember(context) { AndroidMediaSession(context) }
    DisposableEffect(session) { onDispose { session.release() } }
    return session
}

private const val CHANNEL = "dev.rinzai.zen.media"
private const val NOTIFICATION = 0x5a454e
private const val ACTION = "dev.rinzai.zen.media.ACTION"

/**
 * A media session and its notification, as Chrome keeps for a page that plays: the lock screen,
 * the shade's controls and headset buttons go to it. From Android 13 the system draws the
 * controls from the session; before, the notification's buttons are ours.
 */
private class AndroidMediaSession(private val context: Context) : PlatformMediaSession {
    private val session = AndroidSession(context, "Zen")
    private val notifications = context.getSystemService(NotificationManager::class.java)
    private var actions: MediaActions? = null
    private var playing = false
    private var described = false
    private var started = false

    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(c: Context, intent: Intent) {
            val a = actions ?: return
            when (intent.getStringExtra(ACTION)) {
                "play" -> a.play()
                "pause" -> a.pause()
                "previous" -> a.previous?.invoke()
                "next" -> a.next?.invoke()
            }
        }
    }

    init {
        notifications.createNotificationChannel(
            NotificationChannel(CHANNEL, "Now playing", NotificationManager.IMPORTANCE_LOW).apply { setShowBadge(false) },
        )
        session.setCallback(object : AndroidSession.Callback() {
            override fun onPlay() { actions?.play() }
            override fun onPause() { actions?.pause() }
            override fun onSeekTo(pos: Long) { actions?.seekTo(pos / 1000.0) }
            override fun onFastForward() { actions?.seekBy(true) }
            override fun onRewind() { actions?.seekBy(false) }
            override fun onSkipToPrevious() { actions?.previous?.invoke() }
            override fun onSkipToNext() { actions?.next?.invoke() }
        })
        val filter = IntentFilter(ACTION)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) context.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED)
        else context.registerReceiver(receiver, filter)
    }

    override fun metadata(title: String?, artist: String?, album: String?, artwork: ImageBitmap?, duration: Double) {
        described = title != null || artist != null || album != null || artwork != null
        session.setMetadata(
            MediaMetadata.Builder().apply {
                title?.let { putString(MediaMetadata.METADATA_KEY_TITLE, it) }
                artist?.let { putString(MediaMetadata.METADATA_KEY_ARTIST, it) }
                album?.let { putString(MediaMetadata.METADATA_KEY_ALBUM, it) }
                artwork?.let { putBitmap(MediaMetadata.METADATA_KEY_ART, it.asAndroidBitmap()) }
                if (duration > 0) putLong(MediaMetadata.METADATA_KEY_DURATION, (duration * 1000).toLong())
            }.build(),
        )
        post()
    }

    override fun state(playing: Boolean, position: Double, rate: Double) {
        this.playing = playing
        if (playing) started = true
        session.setPlaybackState(
            PlaybackState.Builder()
                .setState(
                    if (playing) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED,
                    (position * 1000).toLong(),
                    if (playing) rate.toFloat() else 0f,
                    SystemClock.elapsedRealtime(),
                )
                .setActions(available())
                .build(),
        )
        post()
    }

    override fun actions(actions: MediaActions) {
        this.actions = actions
        post()
    }

    private fun available(): Long {
        var a = PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or PlaybackState.ACTION_PLAY_PAUSE or
            PlaybackState.ACTION_SEEK_TO or PlaybackState.ACTION_FAST_FORWARD or PlaybackState.ACTION_REWIND
        if (actions?.previous != null) a = a or PlaybackState.ACTION_SKIP_TO_PREVIOUS
        if (actions?.next != null) a = a or PlaybackState.ACTION_SKIP_TO_NEXT
        return a
    }

    // Shown once something has played, as Chrome shows a page's; it stays while paused, and can be swiped away then.
    private fun post() {
        if (!described || !started) return
        session.isActive = true
        val buttons = buildList {
            if (actions?.previous != null) add(button("previous", android.R.drawable.ic_media_previous, "Previous"))
            add(if (playing) button("pause", android.R.drawable.ic_media_pause, "Pause") else button("play", android.R.drawable.ic_media_play, "Play"))
            if (actions?.next != null) add(button("next", android.R.drawable.ic_media_next, "Next"))
        }
        val main = buttons.indices.toList().toIntArray()
        val open = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?.let { PendingIntent.getActivity(context, 0, it, PendingIntent.FLAG_IMMUTABLE) }
        val notification = Notification.Builder(context, CHANNEL)
            .setSmallIcon(context.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.ic_media_play)
            .setStyle(Notification.MediaStyle().setMediaSession(session.sessionToken).setShowActionsInCompactView(*main))
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(playing)
            .setContentIntent(open)
            .apply { buttons.forEach(::addAction) }
            .build()
        notifications.notify(NOTIFICATION, notification)
    }

    private fun button(action: String, icon: Int, label: String): Notification.Action {
        val intent = Intent(ACTION).setPackage(context.packageName).putExtra(ACTION, action)
        val pending = PendingIntent.getBroadcast(context, action.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        return Notification.Action.Builder(Icon.createWithResource(context, icon), label, pending).build()
    }

    fun release() {
        notifications.cancel(NOTIFICATION)
        context.unregisterReceiver(receiver)
        session.release()
    }
}
