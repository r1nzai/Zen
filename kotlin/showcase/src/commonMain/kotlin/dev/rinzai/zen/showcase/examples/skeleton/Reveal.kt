package dev.rinzai.zen.showcase.examples.skeleton

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.skeleton.Skeleton

@Composable
fun Reveal() {
    var loading by remember { mutableStateOf(true) }
    val shape = Zen.radii.xl
    Column(horizontalAlignment = Alignment.Start, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Column(Modifier.width(320.dp).glowEdge(shape).glass(shape).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Skeleton(loading, Modifier.size(96.dp, 12.dp)) {
                Text("Balance", style = TextStyles.xs, color = Zen.tokens.mutedForeground.color())
            }
            Skeleton(loading, Modifier.size(160.dp, 28.dp)) {
                Text("$4,280.15", style = TextStyles.xl2.merge(TextStyles.semibold).merge(TextStyles.tabular))
            }
        }
        Button({ loading = !loading }, variant = ButtonVariant.Outline) { Text(if (loading) "Load" else "Reload") }
    }
}
