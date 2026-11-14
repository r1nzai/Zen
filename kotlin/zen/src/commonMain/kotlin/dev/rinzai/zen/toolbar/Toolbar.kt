package dev.rinzai.zen.toolbar

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.LocalRoving
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberRoving
import dev.rinzai.zen.separator.Separator

/** Which way the Toolbar this is in runs, or null outside one. */
val LocalToolbarOrientation = staticCompositionLocalOf<Orientation?> { null }

/**
 * A row of controls for one thing, e.g. a table's or an editor's: buttons, ToggleGroups, a menu.
 * Tab enters it once; ←→ (↑↓ when `orientation` is vertical) move between its controls, Home and
 * End jump to the ends. Divide it with ToolbarSeparator; `label` names it.
 */
@Composable
fun Toolbar(
    modifier: Modifier = Modifier,
    label: String? = null,
    orientation: Orientation = Orientation.Horizontal,
    content: @Composable () -> Unit,
) {
    val roving = rememberRoving(orientation)
    val shape = Zen.radii.xl
    val t = Zen.tokens
    val track = modifier
        .semantics { if (label != null) contentDescription = label }
        .glowEdge(shape, Sides.All)
        .box(shape, fill = SolidColor(t.tint.color(0.03f)), border = SolidColor(t.tint.color(0.1f)))
        .padding(4.dp)
    CompositionLocalProvider(LocalRoving provides roving, LocalToolbarOrientation provides orientation) {
        if (orientation == Orientation.Horizontal) {
            Row(track.height(IntrinsicSize.Min), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.CenterVertically) { content() }
        } else {
            Column(track.width(IntrinsicSize.Min), verticalArrangement = Arrangement.spacedBy(4.dp), horizontalAlignment = Alignment.CenterHorizontally) { content() }
        }
    }
}

/** A hairline between groups of a Toolbar's controls, across its direction. */
@Composable
fun ToolbarSeparator(modifier: Modifier = Modifier) {
    if (LocalToolbarOrientation.current == Orientation.Vertical) {
        Separator(modifier.padding(horizontal = 6.dp, vertical = 2.dp).fillMaxWidth())
    } else {
        Separator(modifier.padding(horizontal = 2.dp, vertical = 6.dp), Orientation.Vertical)
    }
}
