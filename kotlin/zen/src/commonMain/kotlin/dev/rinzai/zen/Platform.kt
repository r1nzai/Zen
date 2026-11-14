package dev.rinzai.zen

import androidx.compose.runtime.Composable

/**
 * CSS's `(pointer: coarse)` / `(hover: none)`: a touch screen. Zen drops what a finger can't use or
 * a phone pays too much for there: the pointer light, live blur behind glass, a drifting backdrop.
 */
internal expect val coarsePointer: Boolean

/** `prefers-reduced-motion: reduce`, from the OS setting. */
@Composable
internal expect fun systemReducedMotion(): Boolean

/** Whether to skip motion (it becomes instant): the OS setting, or the app's own switch (Page.reduceMotion). */
@Composable
internal fun reducedMotion(): Boolean = systemReducedMotion() || LocalPage.current.reduceMotion

/** How text is laid out on this platform, where it differs from a browser's by default. */
internal expect val platformText: androidx.compose.ui.text.PlatformTextStyle?

/** CSS's `color-scheme`: the system's own UI around the app (status and navigation bars) drawn to match. */
@Composable
internal expect fun ColorScheme(appearance: Appearance)

/** The device's taps, where Compose has none of its own for the platform (the web's navigator.vibrate). */
internal expect val platformHaptics: androidx.compose.ui.hapticfeedback.HapticFeedback?

/** CSS's `cursor: grab`, and `grabbing` while held. */
internal expect fun grabCursor(grabbing: Boolean): androidx.compose.ui.input.pointer.PointerIcon

/** CSS cursors the platform has its own of. */
internal enum class CssCursor { Move, NsResize, EwResize, NwseResize, NeswResize, NotAllowed }

internal expect fun cssCursor(cursor: CssCursor): androidx.compose.ui.input.pointer.PointerIcon

/** A control's cursor: `pointer`, or `not-allowed` while it's disabled. */
internal fun pressCursor(enabled: Boolean) = if (enabled) androidx.compose.ui.input.pointer.PointerIcon.Hand else cssCursor(CssCursor.NotAllowed)

/** CSS's `cursor: ns-resize` or `ew-resize`. */
internal fun resizeCursor(vertical: Boolean) = cssCursor(if (vertical) CssCursor.NsResize else CssCursor.EwResize)

/**
 * font-mono (ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier
 * New", monospace): the first of those the platform has, as the browser walks the list.
 */
internal expect val monospace: androidx.compose.ui.text.font.FontFamily
