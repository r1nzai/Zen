package dev.rinzai.zen.showcase.examples.sortable

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.radii
import dev.rinzai.zen.sortable.SortableHandle
import dev.rinzai.zen.sortable.SortableList

private val ARTISTS = listOf("Nils Frahm", "Ólafur Arnalds", "Hania Rani", "Max Richter", "Bonobo", "Tycho", "Jon Hopkins")
private val SONGS = (0 until 500).associate { i -> "s$i" to ("Track ${i + 1}" to ARTISTS[(i * 3) % 7]) }

/** A queue of 500 that has only the rows in view: `itemHeight` on the list; dragged near its edge, it scrolls along. */
@Composable
fun Virtual() {
    var order by remember { mutableStateOf(SONGS.keys.toList()) }
    val shape = Zen.radii.xl
    val muted = Zen.tokens.mutedForeground.color()
    SortableList(
        order,
        { order = it },
        Modifier.widthIn(max = 448.dp).fillMaxWidth().height(384.dp).glass(shape).clip(shape),
        itemHeight = 48.dp,
        label = "Up next",
    ) { id ->
        val (title, artist) = SONGS.getValue(id)
        Row(
            Modifier.fillMaxSize().padding(horizontal = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            SortableHandle(id, title)
            Column {
                Text(title, style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(artist, style = TextStyles.xs, color = muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}
