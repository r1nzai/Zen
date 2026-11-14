package dev.rinzai.zen.showcase.examples.stepper

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.stepper.Stepper

/** Importing a statement in three steps. */
@Composable
fun Default() {
    var step by remember { mutableIntStateOf(1) }
    Column(Modifier.widthIn(max = 512.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(32.dp)) {
        Stepper(step) {
            step("Upload", "CSV or Excel")
            step("Map", "Match the columns")
            step("Review", "Check and import")
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button({ step-- }, variant = ButtonVariant.Outline, enabled = step != 0) { Text("Back") }
            Button({ step++ }, enabled = step != 3) { Text(if (step >= 2) "Import" else "Next") }
        }
    }
}
