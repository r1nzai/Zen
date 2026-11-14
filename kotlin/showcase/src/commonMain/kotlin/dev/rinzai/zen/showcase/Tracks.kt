package dev.rinzai.zen.showcase

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.emptystate.EmptyState
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatDuration
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.input.InputType
import dev.rinzai.zen.marquee.Marquee
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.table.Table
import dev.rinzai.zen.table.TableBody
import dev.rinzai.zen.table.TableCell
import dev.rinzai.zen.table.TableContainer
import dev.rinzai.zen.table.TableHead
import dev.rinzai.zen.table.TableHeader
import dev.rinzai.zen.table.TableRow
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuSub
import dev.rinzai.zen.menu.MenuSubContent
import dev.rinzai.zen.menu.MenuSubTrigger
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

@OptIn(ExperimentalLayoutApi::class)
@Composable
internal fun Tracks(
    current: Track,
    playing: Boolean,
    liked: Set<String>,
    onLike: (String) -> Unit,
    onPlay: (String, List<String>) -> Unit,
    onPlayNext: (String) -> Unit,
) {
    val sm = LocalPage.current.atLeast(Breakpoint.Sm)
    val t = Zen.tokens
    var query by remember { mutableStateOf("") }
    val q = query.trim().lowercase()
    val found = TRACKS.filter { tr -> listOf(tr.title, tr.album.title, tr.album.artist).any { q in it.lowercase() } }
    val ids = found.map { it.id }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FlowRow(
            Modifier.fillMaxWidth(),
            horizontalArrangement = spaceBetween(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            itemVerticalAlignment = Alignment.CenterVertically,
        ) {
            Text("All tracks", style = TextStyles.xl.merge(TextStyles.semibold).merge(TextStyles.tight))
            InputGroup(if (sm) Modifier.width(256.dp) else Modifier.fillMaxWidth()) {
                InputGroupAddon { Icon(Icons.Search) }
                InputGroupInput(query, { query = it }, placeholder = "Search tracks, albums, artists", label = "Search tracks", type = InputType.Search)
            }
        }
        if (found.isEmpty()) {
            EmptyState("No tracks found", description = "Nothing matches “${query.trim()}”.")
        } else {
            TableContainer {
                Table(Modifier.fillMaxWidth()) {
                    TableHeader {
                        TableRow {
                            if (sm) TableHead(width = 48.dp) { Text("#") }
                            TableHead { Text("Title") }
                            if (sm) TableHead { Text("Album") }
                            TableHead(width = 48.dp)
                            if (sm) TableHead(width = 80.dp, numeric = true) { Text("Length") }
                            TableHead(width = 48.dp)
                        }
                    }
                    TableBody(found, key = { it.id }, rise = true) { tr ->
                        val isCurrent = tr == current
                        val i = found.indexOf(tr)
                        TableRow {
                            if (sm) TableCell {
                                if (isCurrent) Icon(Icons.MusicalNote, color = t.primary.color())
                                else Text(if (i >= 0) "${i + 1}" else "", style = TextStyles.tabular, color = t.mutedForeground.color())
                            }
                            TableCell { TrackButton(tr, isCurrent, playing) { onPlay(tr.id, ids) } }
                            if (sm) TableCell { Text(tr.album.title, color = t.mutedForeground.color()) }
                            TableCell { LikeButton(tr.id in liked, { onLike(tr.id) }, label = tr.title) }
                            if (sm) TableCell(numeric = true) { Text(formatDuration(tr.sound.seconds), color = t.mutedForeground.color()) }
                            TableCell { TrackMenu(tr, tr.id in liked, { onLike(tr.id) }, { onPlayNext(tr.id) }) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TrackButton(track: Track, current: Boolean, playing: Boolean, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    Row(
        Modifier
            .box(Zen.radii.md, shadows = focusRing(state.focusVisible))
            .control(state, label = "${if (current && playing) "Pause" else "Play"} ${track.title}", onClick = onClick),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Cover(track.album.colors, Zen.radii.md, Modifier.size(40.dp))
        Column {
            Marquee(track.title, style = TextStyles.medium, color = if (current) t.primary.color() else androidx.compose.ui.graphics.Color.Unspecified, host = state.source)
            Marquee(track.album.artist, style = TextStyles.xs, color = t.mutedForeground.color(), host = state.source)
        }
    }
}

/** A track's menu: a bottom sheet on phones, as music apps show one, its mixes sliding in over it. */
@Composable
private fun TrackMenu(track: Track, liked: Boolean, onLike: () -> Unit, onPlayNext: () -> Unit) {
    val toast = LocalToaster.current
    val menu = rememberMenuState()
    Button(menu::toggle, Modifier.menuTrigger(menu), variant = ButtonVariant.Ghost, size = ButtonSize.IconSm, label = "More for ${track.title}", popupOpen = menu.open) {
        Icon(Icons.Ellipsis)
    }
    MenuContent(menu, sheet = true) {
        MenuItem({
            onPlayNext()
            toast("${track.title} plays next")
        }, icon = Icons.QueueList, label = "Play next") { Text("Play next") }
        MenuItem(onLike, icon = if (liked) Icons.HeartSolid else Icons.Heart, label = if (liked) "Remove from liked" else "Like") {
            Text(if (liked) "Remove from liked" else "Like")
        }
        MenuSub {
            MenuSubTrigger(icon = Icons.MusicalNote, label = "Add to mix")
            MenuSubContent {
                for (mix in MIXES) MenuItem({ toast("Added to ${mix.title}", tone = ToastTone.Positive) }, label = mix.title) { Text(mix.title) }
            }
        }
    }
}
