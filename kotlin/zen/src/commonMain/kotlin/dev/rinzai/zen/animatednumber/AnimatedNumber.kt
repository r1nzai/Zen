package dev.rinzai.zen.animatednumber

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.withFrameNanos
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import dev.rinzai.zen.Ease
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.Money
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.locale
import dev.rinzai.zen.reducedMotion
import dev.rinzai.zen.transition
import kotlin.math.roundToInt
import kotlin.math.roundToLong

private val CubicOut = Easing { 1 - (1 - it) * (1 - it) * (1 - it) }

/**
 * A number that counts smoothly to each new value (and up from zero when it first appears). Whole
 * numbers while moving, so money in minor units never shows fractions. With `roll`, each digit
 * rolls to its new one instead, like an odometer: easier to read when a total changes. Instant
 * with reduced motion.
 */
@Composable
fun AnimatedNumber(
    value: Long,
    modifier: Modifier = Modifier,
    format: (Long) -> String = Long::toString,
    duration: Int = 650,
    fromZero: Boolean = true,
    roll: Boolean = false,
) {
    ProvideText(style = LocalTextStyle.current.merge(TextStyles.tabular)) {
        if (roll) Rolling(format(value), modifier, duration, fromZero)
        else Counting(value, modifier, format, duration, fromZero)
    }
}

@Composable
private fun Counting(value: Long, modifier: Modifier, format: (Long) -> String, duration: Int, fromZero: Boolean) {
    var shown by remember { mutableLongStateOf(if (fromZero) 0 else value) }
    val reduced = reducedMotion()
    LaunchedEffect(value, duration) {
        if (reduced || duration <= 0) {
            shown = value
            return@LaunchedEffect
        }
        // From wherever it's got to, if a new value comes mid-count.
        val from = shown
        val t = Animatable(0f)
        t.animateTo(1f, tween(duration, easing = Ease.Linear)) {
            shown = from + ((value - from) * CubicOut.transform(this.value).toDouble()).roundToLong()
        }
    }
    Text(format(shown), modifier)
}

@Composable
private fun Rolling(text: String, modifier: Modifier, duration: Int, fromZero: Boolean) {
    // The digits show 0 until the first frame is drawn, then roll to theirs.
    var arrived by remember { mutableStateOf(!fromZero) }
    LaunchedEffect(Unit) {
        withFrameNanos {}
        arrived = true
    }
    Row(
        modifier.clearAndSetSemantics {
            contentDescription = text
            this.text = AnnotatedString(text)
        },
        verticalAlignment = Alignment.Top,
    ) {
        text.forEachIndexed { i, ch ->
            // Keyed from the right, so the ones stay the ones when the number grows a digit.
            key(text.length - i) {
                if (ch.isDigit()) Digit(if (arrived) ch.digitToInt() else 0, duration) else Text(ch.toString())
            }
        }
    }
}

/** One place of a rolling number: a strip of 0–9 behind a one-line window. */
@Composable
private fun Digit(digit: Int, duration: Int) {
    val at by animateFloatAsState(digit.toFloat(), transition(duration, Ease.OutSoft))
    Column(
        Modifier
            .clipToBounds()
            .layout { m, c ->
                val strip = m.measure(c.copy(minHeight = 0, maxHeight = Int.MAX_VALUE))
                val line = strip.height / 10
                layout(strip.width, line) { strip.place(0, -(at * line).roundToInt()) }
            },
    ) {
        for (d in 0..9) Text(d.toString())
    }
}

/** An amount of money (minor units) that counts to each new value. */
@Composable
fun AnimatedMoney(
    value: Money,
    currency: String,
    modifier: Modifier = Modifier,
    locale: String? = null,
    showDecimals: Boolean = false,
    duration: Int = 650,
    fromZero: Boolean = true,
    roll: Boolean = false,
) {
    val tag = locale(locale)
    AnimatedNumber(value, modifier, { formatMoney(it, currency, tag, showDecimals) }, duration, fromZero, roll)
}
