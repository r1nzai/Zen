package dev.rinzai.zen.showcase.examples.liveactivity

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.card.Card
import dev.rinzai.zen.card.CardHeader
import dev.rinzai.zen.card.CardTitle
import dev.rinzai.zen.liveactivity.LiveActivity
import dev.rinzai.zen.liveactivity.LiveActivityContent
import dev.rinzai.zen.liveactivity.rememberLiveActivities
import dev.rinzai.zen.meter.Meter
import kotlinx.coroutines.delay

private class Step(val title: String, val text: String, val chip: String)

private val STEPS = listOf(
    Step("Order confirmed", "The kitchen has it", "Confirmed"),
    Step("Being prepared", "Ready in about 10 min", "10 min"),
    Step("On the way", "Sam is 2 km away", "6 min"),
    Step("Arriving", "Sam is outside", "Now"),
    Step("Delivered", "Enjoy your meal", "Done"),
)

/**
 * A delivery's progress, live in the system's UI as well as here: the status bar chip and lock
 * screen on Android 16 (Live Alerts on ColorOS), the Dynamic Island on iOS. It moves on every few
 * seconds; elsewhere only the card shows it.
 */
@Composable
fun Delivery() {
    val activities = rememberLiveActivities()
    var step by remember { mutableIntStateOf(-1) }
    val tracking = step >= 0
    LaunchedEffect(step) {
        if (step in 0 until STEPS.lastIndex) {
            delay(4000)
            step++
        }
    }
    val current = STEPS.getOrNull(step)
    val progress = (step.coerceAtLeast(0)).toFloat() / STEPS.lastIndex
    if (current != null) {
        LiveActivity(
            LiveActivityContent(
                title = current.title,
                text = current.text,
                progress = progress,
                stops = (1 until STEPS.lastIndex).map { it.toFloat() / STEPS.lastIndex },
                chip = current.chip,
            ),
            active = step < STEPS.lastIndex,
        )
    }
    val muted = Zen.tokens.mutedForeground.color()
    Card(Modifier.widthIn(max = 384.dp).fillMaxWidth()) {
        CardHeader { CardTitle("Your order") }
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Meter(progress.toDouble(), Modifier.fillMaxWidth(), max = 1.0, label = current?.title ?: "Not ordered yet", hint = current?.text, valueText = current?.title)
            Text(
                when {
                    !activities.supported -> "Live activities show on Android and iOS."
                    !activities.permitted -> "Allow notifications to follow it from the lock screen."
                    else -> "Follow it from the status bar and the lock screen."
                },
                style = TextStyles.xs,
                color = muted,
            )
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) {
                if (activities.supported && !activities.permitted) {
                    Button(activities::requestPermission, variant = ButtonVariant.Ghost) { Text("Allow") }
                }
                if (tracking) Button({ step = -1 }, variant = ButtonVariant.Outline) { Text("Cancel") }
                else Button({ step = 0 }) { Text("Place order") }
            }
        }
    }
}
