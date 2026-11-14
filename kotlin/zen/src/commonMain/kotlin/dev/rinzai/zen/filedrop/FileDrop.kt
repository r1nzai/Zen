package dev.rinzai.zen.filedrop

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.draganddrop.dragAndDropTarget
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draganddrop.DragAndDropEvent
import androidx.compose.ui.draganddrop.DragAndDropTarget
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.PickedFile
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.accepts
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.glowFocus
import dev.rinzai.zen.hasFiles
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.rememberDrop
import dev.rinzai.zen.rememberFilePicker
import kotlinx.coroutines.launch

/**
 * Somewhere to drop files, or click (or press Enter) to choose them with the system's picker: it
 * lights up while files are dragged over it. `onFiles` gets those that `accept` allows (one, unless
 * `multiple`); `accept` is as an <input type="file">'s (".csv,.xlsx", "image/\*"). `content` is
 * what it says, e.g. "Drop a CSV here".
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun FileDrop(
    onFiles: (List<PickedFile>) -> Unit,
    modifier: Modifier = Modifier,
    accept: String? = null,
    multiple: Boolean = false,
    enabled: Boolean = true,
    label: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val t = Zen.tokens
    val shape = Zen.radii.xl
    val take by rememberUpdatedState { files: List<PickedFile> ->
        val allowed = files.filter { accepts(it, accept) }.let { if (multiple) it else it.take(1) }
        if (allowed.isNotEmpty()) onFiles(allowed)
    }
    val pick = rememberFilePicker(accept, multiple) { take(it) }
    val drop = rememberDrop()
    val scope = rememberCoroutineScope()
    val state = rememberControlState()
    var over by remember { mutableStateOf(false) }
    val target = remember(drop) {
        object : DragAndDropTarget {
            override fun onEntered(event: DragAndDropEvent) {
                over = true
            }
            override fun onExited(event: DragAndDropEvent) {
                over = false
            }
            override fun onEnded(event: DragAndDropEvent) {
                over = false
            }
            override fun onDrop(event: DragAndDropEvent): Boolean {
                over = false
                val load = drop(event)
                scope.launch { take(load()) }
                return true
            }
        }
    }
    val spec = tween<androidx.compose.ui.graphics.Color>(200)
    val border by animateColorAsState(
        when {
            over -> t.primary.color(0.6f)
            state.focusVisible -> t.glow.color(0.6f)
            state.hovered -> t.tint.color(0.25f)
            else -> t.tint.color(0.15f)
        },
        spec,
    )
    val fill by animateColorAsState(if (over) t.primary.color(0.1f) else t.tint.color(0.02f), spec)
    val text by animateColorAsState(if (over || state.hovered) t.foreground.color() else t.mutedForeground.color(), spec)
    val shadows = when {
        over -> listOf(Shadow(blur = 32f, spread = -8f, color = t.glow.color(0.8f * t.glowK)))
        state.focusVisible -> t.glowFocus
        else -> emptyList()
    }
    Column(
        modifier
            .alpha(if (enabled) 1f else 0.5f)
            .then(if (enabled) Modifier.dragAndDropTarget({ it.hasFiles() }, target) else Modifier)
            .glowEdge(shape)
            .box(shape, fill = SolidColor(fill), border = SolidColor(border), shadows = shadows, dashed = true)
            .control(state, enabled, label = label) { pick() }
            .padding(32.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        ProvideText(color = text, style = TextStyles.sm.copy(textAlign = TextAlign.Center)) { content() }
    }
}
