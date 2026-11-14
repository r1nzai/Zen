package dev.rinzai.zen.breadcrumbs

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
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

/** The crumbs of a Breadcrumbs: its parents as links, then the page you're on. */
class BreadcrumbsScope internal constructor() {
    internal val crumbs = mutableListOf<Pair<String, (() -> Unit)?>>()

    /** A parent page, a link. */
    fun crumb(text: String, onClick: () -> Unit) {
        crumbs += text to onClick
    }

    /** The page you're on: the last crumb, not a link. */
    fun current(text: String) {
        crumbs += text to null
    }
}

/** Where a page sits: its parents as links, then the page itself. */
@Composable
fun Breadcrumbs(modifier: Modifier = Modifier, label: String = LocalMessages.current.breadcrumb, content: BreadcrumbsScope.() -> Unit) {
    val t = Zen.tokens
    val crumbs = BreadcrumbsScope().apply(content).crumbs
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    FlowRow(
        modifier.semantics { contentDescription = label },
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
        itemVerticalAlignment = Alignment.CenterVertically,
    ) {
        crumbs.forEachIndexed { i, (text, onClick) ->
            if (i > 0) Icon(Icons.ChevronRight, Modifier.scale(if (rtl) -1f else 1f, 1f), size = 14.dp, color = t.mutedForeground.color(0.6f))
            if (onClick == null) {
                Text(text, style = TextStyles.sm.merge(TextStyles.medium), color = t.foreground.color(), maxLines = 1, overflow = TextOverflow.Ellipsis)
            } else {
                val state = rememberControlState()
                val colour by animateColorAsState(if (state.hovered) t.foreground.color() else t.mutedForeground.color(), transition(150))
                Text(
                    text,
                    Modifier.box(Zen.radii.sm, shadows = focusRing(state.focusVisible)).control(state, onClick = onClick),
                    style = TextStyles.sm,
                    color = colour,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}
