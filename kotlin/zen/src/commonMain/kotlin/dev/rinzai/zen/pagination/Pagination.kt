package dev.rinzai.zen.pagination

import dev.rinzai.zen.pressScale
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Ease
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.locale
import dev.rinzai.zen.mix
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.transition

/** The pages to show: the first, the last, `siblings` either side of `page`, and a gap (null) where pages are skipped. */
fun pageRange(page: Int, count: Int, siblings: Int = 1): List<Int?> {
    val pages = (setOf(1, count) + (page - siblings..page + siblings).filter { it in 1..count }).sorted()
    val out = mutableListOf<Int?>()
    pages.forEachIndexed { i, p ->
        val gap = p - (pages.getOrNull(i - 1) ?: p)
        // One page skipped shows as itself: a gap mark would be no shorter.
        if (gap == 2) out += p - 1 else if (gap > 2) out += null
        out += p
    }
    return out
}

/**
 * The pages a long list is split into: previous and next, the first and last pages, and those
 * around the current one (`page`, from 1), each calling `onPageChange`. With fewer than 2 pages,
 * nothing is shown.
 */
@Composable
fun Pagination(
    page: Int,
    count: Int,
    onPageChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    siblings: Int = 1,
    label: String? = null,
) {
    if (count < 2) return
    val m = LocalMessages.current
    val tag = locale()
    val flip = if (LocalLayoutDirection.current == LayoutDirection.Rtl) -1f else 1f
    Row(
        modifier.semantics { contentDescription = label ?: m.pages },
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        PageButton(page - 1, count, m.previousPage, onPageChange = onPageChange) {
            Icon(Icons.ChevronLeft, Modifier.graphicsLayer { scaleX = flip })
        }
        for (p in pageRange(page, count, siblings)) {
            if (p == null) {
                Box(Modifier.width(24.dp).clearAndSetSemantics {}, contentAlignment = Alignment.Center) {
                    Text("…", color = Zen.tokens.mutedForeground.color())
                }
            } else {
                PageButton(p, count, m.page(p), current = p == page, onPageChange = onPageChange) {
                    Text(formatNumber(p.toDouble(), tag))
                }
            }
        }
        PageButton(page + 1, count, m.nextPage, onPageChange = onPageChange) {
            Icon(Icons.ChevronRight, Modifier.graphicsLayer { scaleX = flip })
        }
    }
}

/** A ghost icon button as wide as its page number; the current page's lit. */
@Composable
private fun PageButton(
    to: Int,
    count: Int,
    label: String,
    current: Boolean = false,
    onPageChange: (Int) -> Unit,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val enabled = to in 1..count
    val state = rememberControlState(remember { MutableInteractionSource() })
    val spec = transition<Float>(200, Ease.Out)
    val hover by animateFloatAsState(if (state.hovered) 1f else 0f, spec)
    val lit by animateFloatAsState(if (current) 1f else 0f, spec)
    val ink by animateColorAsState(if (current) t.foreground.color() else mix(t.mutedForeground.color(), t.foreground.color(), hover), transition(200, Ease.Out))
    val shape = Zen.radii.lg
    Box(
        Modifier
            .pressScale(state, spec)
            .alpha(if (enabled) 1f else 0.5f)
            .height(40.dp)
            .widthIn(min = 36.dp)
            .box(
                shape,
                // Lit, its hover deepens the tint (hover:bg-primary/20) rather than the ghost's.
                fill = SolidColor(mix(t.tint.color(0.06f * hover), t.primary.color(0.15f + 0.05f * hover), lit)),
                shadows = focusRing(state.focusVisible) + listOf(
                    Shadow(spread = 1f, color = t.primary.color(0.3f * lit), inset = true),
                    Shadow(blur = 18f, spread = -6f, color = t.glow.color(0.6f * t.glowK * lit)),
                ),
            )
            .control(state, enabled, Role.Button) { if (!current) onPageChange(to) }
            .semantics {
                contentDescription = label
                if (current) selected = true
            }
            .padding(horizontal = 8.dp),
        contentAlignment = Alignment.Center,
    ) {
        ProvideText(ink, TextStyles.sm.merge(TextStyles.medium).merge(TextStyles.tabular)) { content() }
    }
}
