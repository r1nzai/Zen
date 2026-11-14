package dev.rinzai.zen.toast

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.WindowInsetsSides
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.only
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawing
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.movableContentWithReceiverOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.runtime.DisposableEffect
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.layout
import androidx.compose.ui.zIndex
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.FocusOnRequest
import dev.rinzai.zen.focusOnRequest
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Portal
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.time.TimeSource

/** What a toast says about how things went: plainly, well, or badly. */
enum class ToastTone { Default, Positive, Negative }

/** A button on a toast, which closes it as it acts. */
class ToastAction(val label: String, val onClick: () -> Unit)

/**
 * Shows a toast: `title`, an optional `description`, a `tone`, an `action`. It goes after
 * `timeout` ms (5s, 10s with an action; 0 keeps it), waiting while the deck is pointed at or
 * focused. Returns its id.
 */
class Toaster internal constructor(private val show: (String, String?, ToastTone, ToastAction?, Long?) -> Int) {
    operator fun invoke(
        title: String,
        description: String? = null,
        tone: ToastTone = ToastTone.Default,
        action: ToastAction? = null,
        timeout: Long? = null,
    ): Int = show(title, description, tone, action, timeout)
}

val LocalToaster = staticCompositionLocalOf<Toaster> { error("Toasts need a ToastProvider above them") }

private const val LIMIT = 3
private const val EXIT_MS = 300L
private const val PEEK = 14f
private const val SHRINK = 0.05f
private const val GAP = 10f
private const val SWIPE_DISTANCE = 60f
private const val SWIPE_SPEED = 0.45f

@Stable
private class ToastItem(
    val id: Int,
    val title: String,
    val description: String?,
    val tone: ToastTone,
    val action: ToastAction?,
    val timeout: Long,
) {
    var leaving by mutableStateOf<Boolean?>(null) // false: fading, true: swiped
    var spent = 0L
    var height by mutableIntStateOf(0)
    val swipe = Animatable(0f)
    var swiping by mutableStateOf(false)
}

/**
 * Where toasts show, over everything at the bottom end of the window: wrap the app in it, and
 * call LocalToaster.current to show one. The newest is in front, two more peek out behind it;
 * pointed at or focused (F8), they spread out to read, and wait. Swipe one to the side to send it away.
 */
@Composable
fun ToastProvider(content: @Composable () -> Unit) {
    val page = LocalPage.current
    val m = LocalMessages.current
    val scope = rememberCoroutineScope()
    val toasts = remember { mutableStateListOf<ToastItem>() }
    var next by remember { mutableIntStateOf(0) }
    val hover = remember { MutableInteractionSource() }
    val hovered by hover.collectIsHoveredAsState()
    var focused by remember { mutableStateOf(false) }
    val viewport = remember { FocusOnRequest() }
    fun dismiss(t: ToastItem, swiped: Boolean = false) {
        if (t.leaving != null) return
        t.leaving = swiped
        scope.launch {
            delay(EXIT_MS)
            toasts.remove(t)
        }
    }
    val toaster = remember {
        Toaster { title, description, tone, action, timeout ->
            val id = next++
            toasts.add(ToastItem(id, title, description, tone, action, timeout ?: if (action != null) 10_000 else 5_000))
            id
        }
    }
    // F8 takes focus to the toasts, wherever it is.
    DisposableEffect(page) {
        val f8: (KeyEvent) -> Boolean = { e ->
            if (e.type == KeyEventType.KeyDown && e.key == Key.F8 && toasts.any { it.leaving == null }) {
                viewport.focus()
                true
            } else false
        }
        page.keys += f8
        onDispose { page.keys -= f8 }
    }
    CompositionLocalProvider(LocalToaster provides toaster, content = content)
    // Moved, not remade, into a modal dialog as one opens, so its toasts carry on as they were.
    val deck = remember { movableContentWithReceiverOf<BoxScope> {
        val staying = toasts.filter { it.leaving == null }
        val expanded = (hovered || focused) && staying.isNotEmpty()
        val md = page.atLeast(Breakpoint.Md)
        val shown = staying.takeLast(LIMIT)
        val front = staying.lastOrNull()
        val density = LocalDensity.current
        val deckHeight = with(density) {
            when {
                shown.isEmpty() -> 0f
                expanded -> shown.sumOf { it.height } + GAP.dp.toPx() * (shown.size - 1)
                else -> (front?.height ?: 0) + PEEK.dp.toPx() * (shown.size - 1)
            }
        }
        val height by animateFloatAsState(deckHeight, transition(300, Ease.OutSoft))
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .windowInsetsPadding(WindowInsets.safeDrawing.only(WindowInsetsSides.Bottom))
                .padding(end = 16.dp, bottom = if (md) 20.dp else 16.dp)
                .then(if (md) Modifier.width(384.dp) else Modifier.fillMaxWidth().padding(start = 16.dp))
                .height(with(density) { height.toDp() })
                .hoverable(hover)
                .onFocusChanged { focused = it.hasFocus }
                .focusOnRequest(viewport)
                .semantics { paneTitle = m.notifications },
        ) {
            toasts.forEachIndexed { i, t ->
                key(t.id) {
                    val newer = staying.filter { it.id > t.id }
                    val index = newer.size
                    val y = with(density) {
                        if (expanded) -(newer.sumOf { it.height } + GAP.dp.toPx() * index)
                        else -PEEK.dp.toPx() * minOf(index, LIMIT - 1)
                    }
                    val scale = if (expanded) 1f else 1f - SHRINK * minOf(index, LIMIT - 1)
                    val behind = !expanded && index > 0 && t.leaving == null
                    ToastCard(
                        t,
                        Modifier.align(Alignment.BottomCenter),
                        z = i + 1f,
                        y = y,
                        scale = scale,
                        hidden = index >= LIMIT,
                        behind = behind,
                        frontHeight = if (behind) front?.height else null,
                        paused = expanded,
                        onDismiss = { swiped -> dismiss(t, swiped) },
                    )
                }
            }
        }
    } }
    DisposableEffect(page, deck) {
        page.toastDeck = deck
        onDispose { if (page.toastDeck === deck) page.toastDeck = null }
    }
    Portal(page.top) { if (page.modals.isEmpty()) deck() }
}

@Composable
private fun ToastCard(
    t: ToastItem,
    modifier: Modifier,
    z: Float,
    y: Float,
    scale: Float,
    hidden: Boolean,
    behind: Boolean,
    frontHeight: Int?,
    paused: Boolean,
    onDismiss: (Boolean) -> Unit,
) {
    val tokens = Zen.tokens
    val m = LocalMessages.current
    val reduced = reducedMotion()
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    val scope = rememberCoroutineScope()
    val shape = Zen.radii.xl2
    val look = when (t.tone) {
        ToastTone.Positive -> Look(tokens.primary.color(0.3f), tokens.primary.color(0.15f), tokens.primary.color(), tokens.primary.color(), Shadow(y = 18f, blur = 50f, spread = -18f, color = tokens.glow.color(0.55f * tokens.glowK)))
        ToastTone.Negative -> Look(tokens.destructive.color(0.4f), tokens.destructive.color(0.1f), tokens.destructive.color(), tokens.destructive.color(), Shadow(y = 18f, blur = 50f, spread = -18f, color = tokens.destructive.color(0.55f * tokens.glowK)))
        ToastTone.Default -> Look(tokens.tint.color(0.1f), tokens.tint.color(0.08f), tokens.foreground.color(), tokens.mutedForeground.color(), tokens.toastShadow)
    }
    // Enters from below, as it first shows; leaves fading down, or off to the side when swiped.
    val enter = remember { Animatable(if (reduced) 1f else 0f) }
    LaunchedEffect(Unit) { if (!reduced) enter.animateTo(1f, tween(400, easing = Ease.OutSoft)) }
    val spec = transition<Float>(400, Ease.OutSoft)
    val ty by animateFloatAsState(y, spec)
    val sc by animateFloatAsState(scale, spec)
    val leave by animateFloatAsState(if (t.leaving != null) 1f else 0f, spec)
    val fade by animateFloatAsState(if (hidden || t.leaving != null) 0f else 1f, spec)
    val bodyAlpha by animateFloatAsState(if (behind) 0f else 1f, transition(300))
    val clampHeight by animateFloatAsState((frontHeight ?: t.height).toFloat(), spec)
    // Time left: runs down while it's showing, waits while the deck is open.
    val left = remember { Animatable(1f) }
    LaunchedEffect(paused, t.leaving) {
        if (t.timeout <= 0 || paused || t.leaving != null) return@LaunchedEffect
        val mark = TimeSource.Monotonic.markNow()
        val already = t.spent
        try {
            left.animateTo(0f, tween((t.timeout - already).toInt().coerceAtLeast(0), easing = LinearEasing))
            onDismiss(false)
        } finally {
            t.spent = already + mark.elapsedNow().inWholeMilliseconds
        }
    }
    Box(
        modifier
            .fillMaxWidth()
            .then(if (frontHeight != null || behind) Modifier.layoutHeight(clampHeight) else Modifier)
            .zIndex(z)
            .graphicsLayer {
                transformOrigin = TransformOrigin(0.5f, 1f)
                val swiped = t.leaving == true
                translationX = t.swipe.value + (if (swiped) size.width * leave * (if (rtl) -1f else 1f) else 0f)
                translationY = ty + (1f - enter.value) * size.height + (if (t.leaving == false) 0.35f * size.height * leave else 0f)
                scaleX = sc
                scaleY = sc
                alpha = fade * enter.value
            }
            .pointerInput(t) {
                // Swiped toward the end to dismiss it, with a mouse or a finger.
                awaitPointerEventScope {
                    while (true) {
                        val down = awaitPointerEvent(PointerEventPass.Main).changes.firstOrNull { it.pressed && !it.previousPressed && !it.isConsumed } ?: continue
                        if (t.leaving != null) continue
                        var dx = 0f
                        var time = down.uptimeMillis
                        var speed = 0f
                        t.swiping = true
                        while (true) {
                            val c = awaitPointerEvent().changes.firstOrNull { it.id == down.id } ?: break
                            val now = (c.position.x - down.position.x) * (if (rtl) -1f else 1f)
                            speed = (now - dx) / maxOf(1L, c.uptimeMillis - time)
                            dx = now
                            time = c.uptimeMillis
                            scope.launch { t.swipe.snapTo((if (dx > 0) dx else dx / 6f) * (if (rtl) -1f else 1f)) }
                            if (!c.pressed) break
                        }
                        t.swiping = false
                        if (dx > SWIPE_DISTANCE.dp.toPx() || (dx > 0 && speed > SWIPE_SPEED)) onDismiss(true)
                        else scope.launch { t.swipe.animateTo(0f, tween(400, easing = Ease.OutSoft)) }
                    }
                }
            }
            .glowEdge(shape)
            .glass(shape, blur = true, shadow = look.glow, border = look.ring)
            .semantics { liveRegion = if (t.tone == ToastTone.Negative) LiveRegionMode.Assertive else LiveRegionMode.Polite; contentDescription = listOfNotNull(t.title, t.description).joinToString(". ") },
    ) {
        Row(
            Modifier
                .fillMaxWidth()
                .onSizeChanged { t.height = it.height + 2 }
                .graphicsLayer { alpha = bodyAlpha }
                .padding(start = 14.dp, top = 14.dp, bottom = 14.dp, end = 40.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(Modifier.padding(top = 2.dp).size(32.dp).box(CircleShape, fill = SolidColor(look.badge)), contentAlignment = Alignment.Center) {
                Icon(
                    when (t.tone) {
                        ToastTone.Positive -> Icons.CheckMicro
                        ToastTone.Negative -> Icons.ExclamationTriangleMicro
                        ToastTone.Default -> Icons.InformationCircleMicro
                    },
                    color = look.ink,
                )
            }
            Column(Modifier.weight(1f).padding(top = 2.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(t.title, style = TextStyles.sm.merge(TextStyles.semibold))
                if (t.description != null) Text(t.description, style = TextStyles.sm.copy(lineHeight = 20.sp), color = tokens.mutedForeground.color())
                if (t.action != null) {
                    val a = rememberControlState()
                    Box(
                        Modifier
                            .padding(top = 8.dp)
                            .box(Zen.radii.lg, fill = SolidColor(tokens.tint.color(if (a.hovered) 0.12f else 0.06f)), border = SolidColor(tokens.tint.color(0.1f)), shadows = focusRing(a.focusVisible))
                            .control(a, label = t.action.label) {
                                t.action.onClick()
                                onDismiss(false)
                            }
                            .padding(horizontal = 12.dp, vertical = 4.dp),
                    ) { Text(t.action.label, style = TextStyles.xs.merge(TextStyles.medium)) }
                }
            }
        }
        val close = rememberControlState()
        Box(
            Modifier
                .align(Alignment.TopEnd)
                .padding(top = 10.dp, end = 10.dp)
                .size(28.dp)
                .graphicsLayer { alpha = bodyAlpha }
                .box(Zen.radii.lg, fill = SolidColor(tokens.tint.color(if (close.hovered) 0.07f else 0f)), shadows = focusRing(close.focusVisible))
                .control(close, label = m.dismiss) { onDismiss(false) },
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.XMarkMicro, size = 14.dp, color = if (close.hovered) tokens.foreground.color() else tokens.mutedForeground.color())
        }
        // With reduced motion the bar's animation ends at once, as theme.css ends every zen__ one; the time still runs.
        if (t.timeout > 0 && !reducedMotion()) {
            Box(
                Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .height(2.dp)
                    .graphicsLayer {
                        alpha = 0.6f * bodyAlpha
                        transformOrigin = TransformOrigin(if (rtl) 1f else 0f, 0.5f)
                        scaleX = left.value
                    }
                    .box(RectangleShape, fill = SolidColor(look.bar)),
            )
        }
    }
}

/** A tone's colours: the card's border, the icon's badge and its ink, the timer bar, and the glow under it. */
private class Look(val ring: Color, val badge: Color, val ink: Color, val bar: Color, val glow: Shadow)

/** A card behind the front one takes the front one's height, as the deck shows only their edges. */
private fun Modifier.layoutHeight(px: Float) = this.then(
    Modifier.layout { measurable, constraints ->
        val h = px.toInt()
        val p = measurable.measure(constraints.copy(minHeight = h, maxHeight = h))
        layout(p.width, h) { p.place(0, 0) }
    },
)
