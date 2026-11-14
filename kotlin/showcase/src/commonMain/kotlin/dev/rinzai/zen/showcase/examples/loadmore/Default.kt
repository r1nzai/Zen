package dev.rinzai.zen.showcase.examples.loadmore

import dev.rinzai.zen.ScrollArea
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.Arrangement
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.loadmore.LoadMore
import dev.rinzai.zen.radii
import dev.rinzai.zen.rise
import kotlinx.coroutines.delay

private const val PAGE = 12
private const val TOTAL = 60

/** Scroll to the end and the next page loads; there's a button for it too. */
@Composable
fun Default() {
    var count by remember { mutableIntStateOf(PAGE) }
    var loading by remember { mutableStateOf(false) }
    // Stands in for a request.
    LaunchedEffect(loading) {
        if (loading) {
            delay(700)
            count += PAGE
            loading = false
        }
    }
    val shape = Zen.radii.xl
    val line = Zen.tokens.tint.color(0.06f)
    ScrollArea(Modifier.widthIn(max = 384.dp).fillMaxWidth().height(320.dp).glowEdge(shape).glass(shape).clip(shape), vertical = rememberScrollState()) { Column {
        ProvideText(style = TextStyles.sm) {
            for (i in 0 until count) {
                Row(
                    Modifier
                        .rise(i, list = true)
                        .fillMaxWidth()
                        .drawBehind { if (i > 0) drawRect(line, size = size.copy(height = 1.dp.toPx())) }
                        .padding(start = 16.dp, end = 16.dp, top = if (i > 0) 11.dp else 10.dp, bottom = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Entry ${i + 1}")
                    Text("−$${(i * 37) % 180 + 6}", style = TextStyles.tabular)
                }
            }
        }
        LoadMore({ loading = true }, hasMore = count < TOTAL, loading = loading)
    }}
}
