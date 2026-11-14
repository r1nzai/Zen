package dev.rinzai.zen.showcase.examples.popover

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.popupRow
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.popover.PopoverContent
import dev.rinzai.zen.popupAnchor
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberPopupState

/** Your own trigger: here an avatar button. */
@Composable
fun ProfileCard() {
    val t = Zen.tokens
    val popover = rememberPopupState()
    val state = rememberControlState(popupOpen = popover.open)
    Box(
        Modifier
            .size(36.dp)
            .box(CircleShape, fill = SolidColor(t.primary.color()), shadows = focusRing(state.focusVisible))
            .popupAnchor(popover)
            .control(state, label = "Alex Johnson") { popover.toggle() },
        contentAlignment = Alignment.Center,
    ) { Text("AJ", style = TextStyles.sm.merge(TextStyles.bold), color = t.primaryForeground.color()) }
    PopoverContent(popover, label = "Alex Johnson") {
        Column(Modifier.width(256.dp).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(Modifier.popupRow(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(40.dp).box(CircleShape, fill = SolidColor(t.primary.color())), contentAlignment = Alignment.Center) {
                    Text("AJ", style = TextStyles.sm.merge(TextStyles.bold), color = t.primaryForeground.color())
                }
                Column {
                    Text("Alex Johnson", style = TextStyles.sm.merge(TextStyles.semibold))
                    Text("alex@example.com", style = TextStyles.xs, color = t.mutedForeground.color())
                }
            }
            Row(Modifier.popupRow(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Badge { Text("Admin") }
                Badge(variant = BadgeVariant.Outline) { Text("Pro") }
            }
            Column(
                Modifier
                    .popupRow()
                    .fillMaxWidth()
                    .box(RectangleShape, border = SolidColor(t.tint.color(0.1f)), sides = Sides(top = 1.dp))
                    .padding(top = 12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                val start = Modifier.fillMaxWidth()
                Button({}, start, variant = ButtonVariant.Ghost, size = ButtonSize.Sm, contentAlignment = Alignment.Start) { Text("View profile") }
                Button({}, start, variant = ButtonVariant.Ghost, size = ButtonSize.Sm, contentAlignment = Alignment.Start) { Text("Settings") }
                Button({}, start, variant = ButtonVariant.Ghost, size = ButtonSize.Sm, color = t.destructive.color(), contentAlignment = Alignment.Start) { Text("Sign out") }
            }
        }
    }
}
