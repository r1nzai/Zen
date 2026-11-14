package dev.rinzai.zen.showcase.examples.inputgroup

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.input.InputType

@Composable
fun Default() {
    var search by remember { mutableStateOf("") }
    var site by remember { mutableStateOf("") }
    var weight by remember { mutableStateOf("") }
    Column(Modifier.width(320.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        InputGroup {
            InputGroupAddon { Icon(Icons.Search) }
            InputGroupInput(search, { search = it }, placeholder = "Search entries")
        }
        InputGroup {
            InputGroupAddon { Text("https://") }
            InputGroupInput(site, { site = it }, placeholder = "zen.rinzai")
            InputGroupAddon { Text(".dev") }
        }
        InputGroup {
            InputGroupInput(weight, { weight = it }, placeholder = "72", type = InputType.Numeric, style = TextStyles.tabular)
            InputGroupAddon { Text("kg") }
        }
    }
}
