package dev.rinzai.zen.showcase.examples.segmented

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Text
import dev.rinzai.zen.segmented.Segmented

@Composable
fun Default() {
    var glow by remember { mutableStateOf("soft") }
    Segmented(glow, { glow = it }, label = "Glow") {
        SegmentedItem("off") { Text("Off") }
        SegmentedItem("soft") { Text("Soft") }
        SegmentedItem("bright") { Text("Bright") }
    }
}
