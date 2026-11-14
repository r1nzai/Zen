package dev.rinzai.zen.showcase.examples.skeleton

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Zen
import dev.rinzai.zen.glass
import dev.rinzai.zen.glowEdge
import dev.rinzai.zen.radii
import dev.rinzai.zen.skeleton.Skeleton

@Composable
fun LoadingCard() {
    val shape = Zen.radii.xl
    Column(Modifier.width(320.dp).glowEdge(shape).glass(shape).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Skeleton(Modifier.size(96.dp, 12.dp))
        Skeleton(Modifier.size(160.dp, 28.dp))
        Skeleton(Modifier.fillMaxWidth().height(12.dp))
    }
}
