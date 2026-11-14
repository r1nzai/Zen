package dev.rinzai.zen.showcase

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.carousel.Carousel
import dev.rinzai.zen.carousel.CarouselContent
import dev.rinzai.zen.carousel.CarouselControls
import dev.rinzai.zen.carousel.CarouselItem
import dev.rinzai.zen.carousel.CarouselNext
import dev.rinzai.zen.carousel.CarouselPrevious
import dev.rinzai.zen.control
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.marquee.Marquee
import dev.rinzai.zen.radii
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.spaceBetween
import dev.rinzai.zen.transition

/** Tailwind's shadow-lg. */
private val SHADOW_LG = listOf(
    Shadow(y = 10f, blur = 15f, spread = -3f, color = Color.Black.copy(alpha = 0.1f)),
    Shadow(y = 4f, blur = 6f, spread = -4f, color = Color.Black.copy(alpha = 0.1f)),
)

@Composable
internal fun Mixes(onPlay: (Mix) -> Unit, modifier: Modifier = Modifier) {
    val page = LocalPage.current
    Carousel(modifier, label = "Made for you") {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = spaceBetween(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("Made for you", style = TextStyles.xl.merge(TextStyles.semibold).merge(TextStyles.tight))
            CarouselControls(margin = 0.dp) {
                CarouselPrevious()
                CarouselNext()
            }
        }
        CarouselContent(Modifier.padding(top = 12.dp), gap = 16.dp) {
            val basis = when {
                page.atLeast(Breakpoint.Lg) -> width * 0.22f - 12.dp
                page.atLeast(Breakpoint.Sm) -> width * 0.33333f - 10.667.dp
                else -> width * 0.5f - 8.dp
            }
            for (mix in MIXES) CarouselItem(basis = basis) { MixCard(mix, basis) { onPlay(mix) } }
        }
    }
}

@Composable
private fun MixCard(mix: Mix, basis: Dp, onClick: () -> Unit) {
    val t = Zen.tokens
    val state = rememberControlState()
    val shown by animateFloatAsState(if (state.hovered || state.focusVisible) 1f else 0f, transition(150))
    Column(
        Modifier
            .fillMaxWidth()
            .box(Zen.radii.xl, shadows = focusRing(state.focusVisible))
            .control(state, label = mix.title, onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box {
            // aspect-square of the slide's exact width: the same height whichever way its edges round.
            Cover(mix.colors, Zen.radii.xl, Modifier.fillMaxWidth().height(basis))
            Box(
                Modifier
                    .align(Alignment.BottomEnd)
                    .padding(end = 12.dp, bottom = 12.dp)
                    .graphicsLayer {
                        alpha = shown
                        translationY = (1f - shown) * 4.dp.toPx()
                    }
                    .size(40.dp)
                    .box(CircleShape, fill = SolidColor(t.primary.color()), shadows = SHADOW_LG),
                contentAlignment = Alignment.Center,
            ) { Icon(Icons.Play, size = 20.dp, color = t.primaryForeground.color()) }
        }
        Column {
            Marquee(mix.title, style = TextStyles.sm.merge(TextStyles.medium), host = state.source)
            Marquee(mix.lead, style = TextStyles.xs, color = t.mutedForeground.color(), host = state.source)
        }
    }
}
