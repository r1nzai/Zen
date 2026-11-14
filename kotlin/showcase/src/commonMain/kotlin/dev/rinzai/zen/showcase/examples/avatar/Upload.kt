package dev.rinzai.zen.showcase.examples.avatar

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.painter.BitmapPainter
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.ImageCropError
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.avatar.Avatar
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.cropImageToSquare
import dev.rinzai.zen.rememberFilePicker
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.decodeToImageBitmap

/** cropImageToSquare centres, crops and shrinks a chosen image to a small WebP. */
@Composable
fun Upload() {
    var image by remember { mutableStateOf<ImageBitmap?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val choose = rememberFilePicker("image/*") { (file) ->
        scope.launch {
            try {
                image = cropImageToSquare(file, 160).decodeToImageBitmap()
                error = null
            } catch (e: ImageCropError) {
                error = e.message
            }
        }
    }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Avatar("You", image = image?.let(::BitmapPainter), size = 64.dp, textStyle = TextStyles.xl)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Button(choose, variant = ButtonVariant.Outline, size = ButtonSize.Sm) { Text("Choose a picture") }
            error?.let { Text(it, color = Zen.tokens.destructive.color(), style = TextStyles.xs) }
        }
    }
}
