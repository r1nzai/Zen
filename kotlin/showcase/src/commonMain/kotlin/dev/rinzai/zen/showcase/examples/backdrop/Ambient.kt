package dev.rinzai.zen.showcase.examples.backdrop

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.AmbientGlow
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.input.Input

/**
 * For a screen that never gets a pointer, such as a stream overlay: inside AmbientGlow the edge
 * light goes slowly round each border by itself. Wrap the whole app, or any part of it.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun Ambient() {
    var message by remember { mutableStateOf("") }
    AmbientGlow {
        FlowRow(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Stat("Now playing", "Lo-fi beats", Modifier.width(224.dp))
            Card(Modifier.width(256.dp)) {
                CardTitle("Chat", Modifier.padding(bottom = 12.dp))
                Input(message, { message = it }, Modifier.fillMaxWidth(), placeholder = "Say something", label = "Message")
            }
        }
    }
}
