package dev.rinzai.zen.showcase.examples.backdrop

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Frame
import dev.rinzai.zen.Zen
import dev.rinzai.zen.backdrop.Backdrop
import dev.rinzai.zen.backdrop.Pattern
import dev.rinzai.zen.card.Stat
import dev.rinzai.zen.card.StatTone
import dev.rinzai.zen.radii

@Composable
fun Dots() {
    Frame(Modifier.fillMaxWidth().height(384.dp).clip(Zen.radii.xl)) {
        Backdrop(pattern = Pattern.Dots)
        Box(Modifier.fillMaxSize().padding(32.dp), contentAlignment = Alignment.Center) {
            Stat("Net this month", "$3,330", Modifier.width(240.dp), tone = StatTone.Positive)
        }
    }
}
