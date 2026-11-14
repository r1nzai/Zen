package dev.rinzai.zen.showcase.examples.menu

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.avatar.Avatar
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuHeader
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.ring
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.title
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone
import dev.rinzai.zen.transition

/** Your own trigger (an avatar), a header that isn't a choice, icons, groups, and a destructive item. */
@Composable
fun Account() {
    val toast = LocalToaster.current
    val email = "rin@example.com"
    val menu = rememberMenuState()
    val t = Zen.tokens
    val state = rememberControlState(popupOpen = menu.open)
    val scale by animateFloatAsState(if (state.hovered) 1.05f else 1f, transition(200))
    val ring = when {
        state.focusVisible -> listOf(ring(t.ring.color(0.5f), 2f))
        menu.open -> listOf(ring(t.ring.color(0.4f), 2f))
        else -> emptyList()
    }
    Avatar(
        email,
        Modifier
            .graphicsLayer { scaleX = scale; scaleY = scale }
            .box(CircleShape, shadows = ring)
            .menuTrigger(menu)
            .control(state, label = "Account menu") { menu.toggle() },
    )
    MenuContent(
        menu,
        Modifier.width(256.dp),
        offset = 10.dp,
        shadow = Shadow(y = 20f, blur = 60f, spread = -20f, color = Color.Black.copy(alpha = 0.8f)),
    ) {
        MenuHeader {
            Avatar(email, size = 40.dp)
            Column(Modifier.weight(1f, fill = false)) {
                Text("Signed in as", style = TextStyles.xs, color = t.mutedForeground.color())
                Text(email, Modifier.title(email), style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        MenuSeparator()
        MenuItem({ toast("Settings") }, icon = Icons.Settings) { Text("Settings") }
        MenuItem({ toast("Locked", tone = ToastTone.Positive) }, icon = Icons.Lock) { Text("Lock now") }
        MenuSeparator()
        MenuItem({ toast("Logged out") }, icon = Icons.Logout, negative = true) { Text("Log out") }
    }
}
