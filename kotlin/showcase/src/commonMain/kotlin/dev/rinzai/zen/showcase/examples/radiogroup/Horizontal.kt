package dev.rinzai.zen.showcase.examples.radiogroup

import androidx.compose.foundation.gestures.Orientation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Text
import dev.rinzai.zen.radiogroup.RadioGroup

/** In a row, with one option disabled. */
@Composable
fun Horizontal() {
    var every by remember { mutableStateOf<String?>(null) }
    RadioGroup(every, { every = it }, label = "Repeat", orientation = Orientation.Horizontal) {
        Radio("week") { Text("Weekly") }
        Radio("month") { Text("Monthly") }
        Radio("year") { Text("Yearly") }
        Radio("custom", enabled = false) { Text("Custom") }
    }
}
