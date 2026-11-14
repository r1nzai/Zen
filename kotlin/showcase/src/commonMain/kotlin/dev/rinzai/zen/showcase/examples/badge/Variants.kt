package dev.rinzai.zen.showcase.examples.badge

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeTone
import dev.rinzai.zen.badge.BadgeVariant

@Composable
fun Variants() {
    FlowRow(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp), itemVerticalAlignment = Alignment.CenterVertically) {
        Badge { Text("New") }
        Badge(variant = BadgeVariant.Secondary) { Text("Draft") }
        Badge(tone = BadgeTone.Negative) { Text("Overdue") }
        Badge(variant = BadgeVariant.Outline) { Text("Archived") }
    }
}
