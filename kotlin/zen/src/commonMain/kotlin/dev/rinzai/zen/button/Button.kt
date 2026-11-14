package dev.rinzai.zen.button

import dev.rinzai.zen.pressScale
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.radii
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalContentColor
import dev.rinzai.zen.spinner.Spinner
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.control
import dev.rinzai.zen.linearGradient
import dev.rinzai.zen.mix
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.ring
import dev.rinzai.zen.rovingItem
import dev.rinzai.zen.transition

enum class ButtonVariant {
    Default, Secondary, Outline, Ghost,

    /** Inline in running text: no padding, the text's own size, underlined when pointed at. */
    Link,
}

/**
 * Negative for a destructive action: a Default button filled red, a Ghost one red when pointed at,
 * a Link red. Muted and Inherit are for links: muted (and always underlined, to read as a link), or
 * in the surrounding text's colour.
 */
enum class ButtonTone { Default, Muted, Inherit, Negative }

/** Heights match the fields' size for size, so they line up in a row; the Icon sizes are squares for a lone icon. */
enum class ButtonSize(internal val height: Dp, internal val padding: Dp, internal val square: Boolean = false) {
    Default(40.dp, 16.dp),
    Sm(32.dp, 12.dp),
    Lg(44.dp, 24.dp),
    Icon(40.dp, 0.dp, true),
    IconSm(32.dp, 0.dp, true),
    IconLg(44.dp, 0.dp, true),

    /** A small square inside a row (e.g. "add item"), rounded-md. */
    IconXs(24.dp, 0.dp, true),
}

/**
 * A button in one of Zen's styles. `shape` replaces its rounding (rounded-lg), e.g. CircleShape
 * for rounded-full; `size` a square's side (size-16). `color` sets its text colour where the
 * variant's would be (text-primary on a ghost button: hover still turns it to the foreground, as
 * CSS's :hover rule wins). `pressed` is aria-pressed, for toggles. `label` names a button that
 * shows only an icon.
 */
@Composable
fun Button(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.Default,
    size: ButtonSize = ButtonSize.Default,
    enabled: Boolean = true,
    tone: ButtonTone = ButtonTone.Default,
    shape: Shape? = null,
    side: Dp? = null,
    color: Color? = null,
    label: String? = null,
    pressed: Boolean? = null,
    popupOpen: Boolean = false,
    /** Shows a spinner and disables the button while an action runs. */
    loading: Boolean = false,
    /** Where the content sits across a button wider than it, e.g. Start for a menu-like list. */
    contentAlignment: Alignment.Horizontal = Alignment.CenterHorizontally,
    source: MutableInteractionSource = remember { MutableInteractionSource() },
    content: @Composable RowScope.() -> Unit,
) {
    val t = Zen.tokens
    val link = variant == ButtonVariant.Link
    val shape = shape ?: when {
        link -> Zen.radii.sm
        size == ButtonSize.IconXs -> Zen.radii.md
        else -> Zen.radii.lg
    }
    val on = enabled && !loading
    val inherited = LocalContentColor.current
    val state = rememberControlState(source, popupOpen)
    val hover by animateFloatAsState(if (state.hovered) 1f else 0f, transition(200, Ease.Out))
    val k = t.glowK
    val negative = tone == ButtonTone.Negative

    val fg = when (variant) {
        ButtonVariant.Default -> color ?: if (negative) t.destructiveForeground.color() else t.primaryForeground.color()
        ButtonVariant.Secondary, ButtonVariant.Outline -> color ?: t.foreground.color()
        ButtonVariant.Ghost -> mix(color ?: t.mutedForeground.color(), if (negative) t.destructive.color() else t.foreground.color(), hover)
        ButtonVariant.Link -> color ?: when (tone) {
            ButtonTone.Muted -> mix(t.mutedForeground.color(), t.foreground.color(), hover)
            ButtonTone.Inherit -> inherited
            ButtonTone.Negative -> t.destructive.color()
            ButtonTone.Default -> t.primary.color()
        }
    }
    val text by animateColorAsState(fg, transition(200, Ease.Out))
    val fill: Brush? = when (variant) {
        ButtonVariant.Default -> null
        ButtonVariant.Secondary -> SolidColor(t.primary.color(0.15f + 0.1f * hover))
        ButtonVariant.Outline -> SolidColor(t.tint.color(0.03f + 0.04f * hover))
        ButtonVariant.Link -> null
        ButtonVariant.Ghost -> SolidColor(if (negative) t.destructive.color(0.1f * hover) else t.tint.color(0.06f * hover))
    }
    val shadows = when (variant) {
        ButtonVariant.Default -> if (negative) listOf(
            ring(t.destructive.color(0.6f), 1f),
            Shadow(blur = 22f, spread = -8f, color = t.destructive.color(0.7f * k)),
        ) else listOf(
            ring(t.glow.color(0.55f + 0.25f * hover), 1f),
            Shadow(blur = 22f + 6f * hover, spread = -6f + 2f * hover, color = t.glow.color((0.7f + 0.15f * hover) * k)),
            Shadow(y = 1f, color = Color.White.copy(alpha = 0.3f + 0.05f * hover), inset = true),
        )
        ButtonVariant.Secondary -> listOf(Shadow(spread = 1f, color = t.primary.color(0.25f), inset = true))
        else -> emptyList()
    }
    val height = side ?: size.height
    Row(
        modifier
            .pressScale(state, transition(200, Ease.Out), enabled = !link)
            .then(if (on) Modifier else Modifier.alpha(0.5f))
            .then(
                when {
                    link -> Modifier
                    size.square || side != null -> Modifier.size(height)
                    else -> Modifier.height(height)
                },
            )
            .then(if (variant == ButtonVariant.Outline) Modifier.glowEdge(shape, Sides.All) else Modifier)
            .then(
                if (variant == ButtonVariant.Default && negative) {
                    Modifier.box(shape, fill = SolidColor(t.destructive.color(0.9f + 0.1f * hover)), shadows = focusRing(state.focusVisible) + shadows)
                } else if (variant == ButtonVariant.Default) {
                    Modifier
                        .box(shape, fill = SolidColor(t.primary.color()), shadows = focusRing(state.focusVisible) + shadows)
                        .box(shape, fill = linearGradient(180f, 0f to Color.White.copy(alpha = 0.16f), 1f to Color.White.copy(alpha = 0f)))
                } else {
                    Modifier.box(
                        shape,
                        fill = fill,
                        border = if (variant == ButtonVariant.Outline) SolidColor(t.tint.color(0.1f + 0.1f * hover)) else null,
                        shadows = focusRing(state.focusVisible) + shadows,
                    )
                },
            )
            .rovingItem(on)
            .control(state, on, Role.Button, onClick = onClick)
            .semantics {
                if (label != null) contentDescription = label
                if (pressed != null) stateDescription = if (pressed) "On" else "Off"
            }
            .padding(horizontal = if (link) 0.dp else size.padding),
        horizontalArrangement = Arrangement.spacedBy(8.dp, contentAlignment),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        val style = when {
            // The text's own size; underlined when pointed at (muted ones always, to read as links).
            link -> TextStyles.medium.copy(textDecoration = if (tone == ButtonTone.Muted || state.hovered) TextDecoration.Underline else null)
            size == ButtonSize.Sm -> TextStyles.xs.merge(TextStyles.medium)
            else -> TextStyles.sm.merge(TextStyles.medium)
        }
        ProvideText(text, style) {
            if (loading) Spinner()
            content()
        }
    }
}
