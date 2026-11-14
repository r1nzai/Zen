package dev.rinzai.zen.showcase.examples.segmented

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import dev.rinzai.zen.Icon
import dev.rinzai.zen.Text
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.segmented.Segmented

/** A SegmentedItem holds anything (here an icon and text), and an option can be disabled. */
@Composable
fun WithIcons() {
    var view by remember { mutableStateOf("list") }
    Segmented(view, { view = it }, label = "View") {
        SegmentedItem("list") {
            Icon(Icons.ListBullet)
            Text("List")
        }
        SegmentedItem("grid") {
            Icon(Icons.Squares)
            Text("Grid")
        }
        SegmentedItem("chart", enabled = false) {
            Icon(Icons.ChartBar)
            Text("Chart")
        }
    }
}
