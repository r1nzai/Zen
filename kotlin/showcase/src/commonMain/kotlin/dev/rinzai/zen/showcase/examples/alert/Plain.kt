package dev.rinzai.zen.showcase.examples.alert

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.Zen
import dev.rinzai.zen.alert.Alert
import dev.rinzai.zen.alert.AlertTone
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.spinner.Spinner

/** `plain`: just the icon and text, for a line inside a card or a form. Any icon, or none. */
@Composable
fun Plain() {
    Card(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            CardHeader(space = 0.dp) { CardTitle("Currency") }
            Alert(plain = true, icon = { Spinner(color = Zen.tokens.primary.color()) }) { Text("Getting today’s rate…") }
            Alert(plain = true, tone = AlertTone.Negative) { Text("Couldn’t get today’s rate, so converting isn’t possible right now.") }
        }
    }
}
