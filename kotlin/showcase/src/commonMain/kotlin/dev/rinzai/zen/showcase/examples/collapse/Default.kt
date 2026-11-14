package dev.rinzai.zen.showcase.examples.collapse

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.badge.Badge
import dev.rinzai.zen.badge.BadgeVariant
import dev.rinzai.zen.collapse.Collapse

private val Tags = listOf("Groceries", "Rent", "Transport", "Dining out", "Subscriptions", "Travel", "Gifts", "Health", "Books")

/** Shows as many tags as fit on one line, and the rest behind "+N". Resize the window to see it adapt. */
@Composable
fun Default() {
    Collapse(Tags, Modifier.widthIn(max = 448.dp).fillMaxWidth(), gap = 4.dp) { tag, _ ->
        Badge(variant = BadgeVariant.Secondary) { Text(tag) }
    }
}
