package dev.rinzai.zen.kbd

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.text.InlineTextContent
import androidx.compose.ui.text.Placeholder
import androidx.compose.ui.text.PlaceholderVerticalAlign
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import dev.rinzai.zen.LocalTextStyle
import dev.rinzai.zen.Shadow
import dev.rinzai.zen.Text
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.fontExtent

/** A key on the keyboard, for shortcuts in hints and tooltips: Kbd("⌘") Kbd("K"). Sized from the text around it. */
@Composable
fun Kbd(key: String, modifier: Modifier = Modifier) {
    val t = Zen.tokens
    val font = LocalTextStyle.current.fontSize * 0.8f
    val size = with(LocalDensity.current) { font.toDp() }
    Box(
        modifier
            .height(size * 1.7f)
            .defaultMinSize(minWidth = size * 1.7f)
            .box(
                RoundedCornerShape(size * 0.4f),
                fill = SolidColor(t.tint.color(0.06f)),
                border = SolidColor(t.tint.color(0.15f)),
                shadows = listOf(Shadow(y = -1f, color = t.tint.color(0.12f), inset = true)),
            )
            .padding(horizontal = size * 0.45f),
        contentAlignment = Alignment.Center,
    ) {
        Text(key, style = TextStyle(fontSize = font, lineHeight = font, fontWeight = FontWeight.Medium), color = t.mutedForeground.color(), softWrap = false)
    }
}

/**
 * A Kbd in a run of text, for a Text's inlineContent where its appendInlineContent(id) goes:
 * Text(buildAnnotatedString { appendInlineContent("shift"); append(" keeps…") }, inlineContent =
 * mapOf("shift" to kbdInline("Shift"))). It sits on the line's baseline as its key's text does.
 */
@Composable
fun kbdInline(key: String): InlineTextContent {
    val font = LocalTextStyle.current.fontSize * 0.8f
    val style = LocalTextStyle.current.merge(TextStyle(fontSize = font, lineHeight = font, fontWeight = FontWeight.Medium))
    val text = rememberTextMeasurer().measure(key, style, softWrap = false).size.width
    val extent = fontExtent(style)
    return with(LocalDensity.current) {
        val size = font.toDp()
        val width = maxOf((size * 1.7f).roundToPx(), text + 2 * (size * 0.45f).roundToPx() + 2 * 1.dp.roundToPx())
        // Its key's line (line-height 1) centred in a box 1.7 of it tall, that line's baseline the text's.
        val f = font.toPx()
        val above = 0.35f * f + extent.ascent - (extent.ascent + extent.descent - f) / 2
        InlineTextContent(Placeholder(width.toSp(), above.toSp(), PlaceholderVerticalAlign.AboveBaseline)) {
            Kbd(key, Modifier.wrapContentSize(Alignment.TopStart, unbounded = true))
        }
    }
}
