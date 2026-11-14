package dev.rinzai.zen.showcase.examples.themetoggle

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Themed
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberThemeTarget
import dev.rinzai.zen.themetoggle.ThemeToggle

/**
 * The theme kept by your app (state here; an account setting or a database in yours): the toggle
 * shows `value`, and `onValueChange` applies the new one. This one themes just its panel, so
 * `target` keeps the water inside it.
 */
@Composable
fun YourState() {
    var theme by remember { mutableStateOf(Appearance.Light) }
    val panel = rememberThemeTarget()
    val shape = Zen.radii.xl2
    Themed(theme, Modifier.fillMaxWidth().height(384.dp), panel, shape) {
        val t = Zen.tokens
        Column(
            Modifier
                .fillMaxSize()
                .box(shape, fill = SolidColor(t.background.color()), border = SolidColor(t.border.color()))
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Preview", style = TextStyles.sm.merge(TextStyles.medium))
                ThemeToggle(value = theme, onValueChange = { theme = it }, target = panel)
            }
            Text("This panel is ${theme.name.lowercase()}; the page around it stays as it is.", style = TextStyles.sm, color = t.mutedForeground.color())
        }
    }
}
