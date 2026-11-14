package dev.rinzai.zen.showcase.examples.tabbar

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Frame
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.tabbar.TabBar
import dev.rinzai.zen.tabbar.TabBarItem

private val TABS = listOf("Month" to Icons.Calendar, "Planner" to Icons.Table, "Goals" to Icons.Flag, "Settings" to Icons.Settings)

/** Phone navigation. Fixed to the bottom of its frame; here a phone-sized Frame stands in for the screen. */
@Composable
fun Default() {
    val t = Zen.tokens
    var current by remember { mutableStateOf("Month") }
    val shape = RoundedCornerShape(16.dp)
    Frame(Modifier.size(320.dp, 288.dp).clip(shape).box(shape, border = SolidColor(t.tint.color(0.1f)))) {
        Text(current, Modifier.padding(16.dp), style = TextStyles.sm, color = t.mutedForeground.color())
        TabBar(label = "Main", hideFrom = null, shape = RoundedCornerShape(bottomStart = 15.dp, bottomEnd = 15.dp)) {
            for ((label, icon) in TABS) TabBarItem(label, icon, onClick = { current = label }, active = label == current)
        }
    }
}
