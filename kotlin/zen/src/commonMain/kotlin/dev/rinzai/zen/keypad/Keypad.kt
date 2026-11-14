package dev.rinzai.zen.keypad

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

private val KEYS = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back")

/**
 * What typing `key` on a keypad makes of `value`: no leading zeros, one point, at most
 * `decimals` digits after it, at most `maxLength` characters.
 */
fun keypadPress(value: String, key: String, decimals: Int = 2, maxLength: Int = 12): String {
    if (key == "back") return value.dropLast(1)
    val point = value.indexOf('.')
    if (key == ".") return if (decimals == 0 || point != -1) value else value.ifEmpty { "0" } + "."
    if (point != -1 && value.length - point > decimals) return value
    if (value.length >= maxLength) return value
    return if (value == "0") key else value + key
}

/**
 * A number pad for typing an amount on a phone, where the system keyboard covers half the screen.
 * The value is the text typed ("12.5"), so a trailing point or zero stays until you convert it.
 * `decimals` is the digits allowed after the point (0 hides the point).
 */
@Composable
fun Keypad(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    decimals: Int = 2,
    maxLength: Int = 12,
    label: String? = null,
    deleteLabel: String? = null,
) {
    val m = LocalMessages.current
    Column(
        modifier.semantics { contentDescription = label ?: m.keypad },
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        for (row in KEYS.chunked(3)) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (key in row) {
                    Key(
                        key,
                        Modifier.weight(1f),
                        // The point takes its place, unseen, where none is allowed.
                        shown = !(key == "." && decimals == 0),
                        label = if (key == "back") deleteLabel ?: m.delete else null,
                    ) { onValueChange(keypadPress(value, key, decimals, maxLength)) }
                }
            }
        }
    }
}

@Composable
private fun Key(key: String, modifier: Modifier, shown: Boolean, label: String?, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState(remember { MutableInteractionSource() })
    val fill by animateColorAsState(t.tint.color(if (state.hovered) 0.09f else 0.05f), transition<Color>(150))
    val scale by animateFloatAsState(if (state.pressed) 0.95f else 1f, transition(150))
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Box(
        modifier
            .alpha(if (shown) 1f else 0f)
            .height(56.dp)
            .fillMaxWidth()
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .box(Zen.radii.xl, fill = SolidColor(fill), shadows = focusRing(state.focusVisible))
            .then(if (shown) Modifier.control(state, label = label, onClick = onClick) else Modifier)
            .semantics { if (label != null) contentDescription = label },
        contentAlignment = Alignment.Center,
    ) {
        if (key == "back") Icon(Icons.ArrowLeft, Modifier.graphicsLayer { if (rtl) scaleX = -1f }, size = 20.dp)
        else Text(key, style = TextStyles.xl.merge(TextStyles.medium).merge(TextStyles.tabular))
    }
}
