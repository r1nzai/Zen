package dev.rinzai.zen.showcase.examples.spinner

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.spinner.Spinner

/** Standing on its own, a spinner needs a label so screen readers announce what is loading. */
@Composable
fun Loading() {
    var loading by remember { mutableStateOf(true) }
    Card(Modifier.width(320.dp)) {
        CardHeader { CardTitle("Entries") }
        if (loading) {
            ProvideText(Zen.tokens.mutedForeground.color(), TextStyles.sm) {
                Row(Modifier.padding(vertical = 24.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Spinner(label = "Loading entries")
                    Text("Loading entries…")
                }
            }
        } else {
            Text("12 entries this month.", Modifier.padding(vertical = 24.dp), style = TextStyles.sm)
        }
        Button({ loading = !loading }, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text(if (loading) "Finish loading" else "Load again") }
    }
}
