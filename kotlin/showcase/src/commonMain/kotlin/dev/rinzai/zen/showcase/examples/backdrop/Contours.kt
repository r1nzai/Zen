package dev.rinzai.zen.showcase.examples.backdrop

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Frame
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.backdrop.Contours
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.radii
import dev.rinzai.zen.showcase.resources.Res

@Composable
fun Contours() {
    // Backdrop fills the viewport; the Frame is the viewport for it here, for the demo.
    Frame(Modifier.fillMaxWidth().height(384.dp).clip(Zen.radii.xl)) {
        Backdrop(remember { Contours { Res.readBytes("files/topo.svg").decodeToString() } })
        Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
            Card(Modifier.width(288.dp)) {
                CardHeader { CardTitle("Move the pointer") }
                Text(
                    "Card edges and the contour lines light up near it.",
                    Modifier.padding(bottom = 16.dp),
                    style = TextStyles.sm,
                    color = Zen.tokens.mutedForeground.color(),
                )
                Button({}, variant = ButtonVariant.Outline) { Text("Outline buttons too") }
            }
        }
    }
}
