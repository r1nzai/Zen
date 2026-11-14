package dev.rinzai.zen.showcase.examples.inputgroup

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput

/** Controls in addons keep their own presses; the text around them focuses the input. */
@Composable
fun WithButton() {
    var query by remember { mutableStateOf("rent") }
    InputGroup(Modifier.width(320.dp), contentPadding = PaddingValues(start = 12.dp, end = 4.dp)) {
        InputGroupAddon { Text("Filter") }
        InputGroupInput(query, { query = it }, label = "Filter")
        if (query.isNotEmpty()) InputGroupAddon {
            Button({ query = "" }, variant = ButtonVariant.Ghost, size = ButtonSize.Sm, modifier = Modifier.height(28.dp)) { Text("Clear") }
        }
    }
}
