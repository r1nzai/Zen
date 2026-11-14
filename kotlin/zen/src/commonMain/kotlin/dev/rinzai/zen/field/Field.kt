package dev.rinzai.zen.field

import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dev.rinzai.zen.FieldControl
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalField
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.alert.Alert
import dev.rinzai.zen.alert.AlertTone
import dev.rinzai.zen.icons.Icons

/**
 * A labelled form control with an optional hint and error. The control in it (Input, Textarea,
 * Checkbox… or your own, through LocalField) is named by the label, focused by a press on it, and
 * marked invalid with the error announced while there is one. The error shows in place of the
 * hint until it's fixed.
 */
@Composable
fun Field(
    label: String,
    modifier: Modifier = Modifier,
    hint: String? = null,
    error: String? = null,
    content: @Composable () -> Unit,
) {
    val t = Zen.tokens
    val focus = remember { FocusRequester() }
    val control = remember(label, error) { FieldControl(label, error, focus) }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        // text-sm leading-none font-medium
        Text(
            label,
            Modifier.pointerInput(focus) { detectTapGestures { runCatching { focus.requestFocus() } } },
            style = TextStyles.sm.merge(TextStyles.medium).copy(lineHeight = 14.sp),
        )
        CompositionLocalProvider(LocalField provides control, content = content)
        if (error != null) FieldError(error)
        else if (hint != null) {
            Text(hint, style = TextStyles.xs, color = t.mutedForeground.color())
        }
    }
}

/** A message for a form as a whole: an error or success in a tinted box, or a quiet note. An Alert, set for forms. */
@Composable
fun FormMessage(modifier: Modifier = Modifier, tone: AlertTone = AlertTone.Default, content: @Composable () -> Unit) =
    Alert(modifier, tone, plain = tone == AlertTone.Default, content = content)

/** A field's error under it, read out as it appears (role="alert"): a warning sign and the message, in red. */
@Composable
internal fun FieldError(error: String, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    Row(
        modifier.semantics { liveRegion = LiveRegionMode.Assertive },
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(Icons.ExclamationTriangleMicro, size = 14.dp, color = t.destructive.color())
        Text(error, style = TextStyles.xs.merge(TextStyles.medium), color = t.destructive.color())
    }
}
