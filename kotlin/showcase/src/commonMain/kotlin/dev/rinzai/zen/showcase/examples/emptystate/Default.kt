package dev.rinzai.zen.showcase.examples.emptystate

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.emptystate.EmptyState
import dev.rinzai.zen.icons.Icons

/** A month with no entries yet: what's missing, and the action that adds the first one. */
@Composable
fun Default() {
    Card(Modifier.widthIn(max = 448.dp).fillMaxWidth()) {
        EmptyState(
            "No entries this month",
            description = "Add your income and spending, or bring them in from a bank statement.",
            icon = Icons.ListBullet,
        ) {
            Button({}) { Text("Add entry") }
            Button({}, variant = ButtonVariant.Outline) { Text("Import") }
        }
    }
}
