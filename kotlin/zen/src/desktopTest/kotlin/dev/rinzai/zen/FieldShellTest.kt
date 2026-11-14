package dev.rinzai.zen

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.input.InputType
import dev.rinzai.zen.textarea.Textarea
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

/** A field's padding is the field's, as an <input>'s is: a press there focuses it; a search's × inside it still clears. */
@OptIn(ExperimentalComposeUiApi::class)
class FieldShellTest {
    private fun ImageComposeScene.click(at: Offset) {
        sendPointerEvent(PointerEventType.Move, at); render(0)
        sendPointerEvent(PointerEventType.Press, at); render(0)
        sendPointerEvent(PointerEventType.Release, at); repeat(3) { render(0) }
    }

    private fun ImageComposeScene.focused(): Boolean {
        fun walk(n: SemanticsNode): Boolean = n.config.getOrNull(SemanticsProperties.Focused) == true || n.children.any(::walk)
        return semanticsOwners.any { walk(it.unmergedRootSemanticsNode) }
    }

    private fun ImageComposeScene.nodes(): List<SemanticsNode> {
        val out = mutableListOf<SemanticsNode>()
        fun walk(n: SemanticsNode) { out += n; n.children.forEach(::walk) }
        semanticsOwners.forEach { walk(it.unmergedRootSemanticsNode) }
        return out
    }

    /** The field's own box: the outermost editable node's parent shell is what's drawn. */
    private fun ImageComposeScene.field() = nodes().first { it.config.contains(SemanticsProperties.EditableText) }.boundsInRoot

    @Test
    fun inputPaddingFocuses() {
        var text by mutableStateOf("abc")
        val scene = ImageComposeScene(300, 100, Density(1f)) { ZenTheme { Input(text, { text = it }, Modifier.width(200.dp)) } }
        repeat(3) { scene.render(0) }
        val b = scene.field()
        scene.click(Offset(b.left + 2f, b.top + 2f))
        assertTrue(scene.focused())
        scene.close()
    }

    @Test
    fun textareaPaddingFocuses() {
        var text by mutableStateOf("abc")
        val scene = ImageComposeScene(300, 200, Density(1f)) { ZenTheme { Textarea(text, { text = it }, Modifier.width(200.dp)) } }
        repeat(3) { scene.render(0) }
        val b = scene.field()
        scene.click(Offset(b.left + 2f, b.bottom - 2f))
        assertTrue(scene.focused())
        scene.close()
    }

    @Test
    fun searchClears() {
        var text by mutableStateOf("abc")
        val scene = ImageComposeScene(300, 100, Density(1f)) { ZenTheme { Input(text, { text = it }, Modifier.width(200.dp), type = InputType.Search) } }
        repeat(3) { scene.render(0) }
        // The ×, 16px wide, 12px in from the field's end.
        val b = scene.field()
        scene.click(Offset(b.right - 12f - 8f, b.center.y))
        assertEquals("", text)
        scene.close()
    }

    @Test
    fun numberSteps() {
        // As stepUp/stepDown: to the next whole step from min, within min and max; empty is 0.
        assertEquals("25", dev.rinzai.zen.input.stepNumber("24", true, 0.0, 640.0))
        assertEquals("3", dev.rinzai.zen.input.stepNumber("2.5", true, 0.0, null))
        assertEquals("2", dev.rinzai.zen.input.stepNumber("2.5", false, 0.0, null))
        assertEquals("1", dev.rinzai.zen.input.stepNumber("", true, 0.0, null))
        assertEquals(null, dev.rinzai.zen.input.stepNumber("0", false, 0.0, null))
        assertEquals(null, dev.rinzai.zen.input.stepNumber("640", true, 0.0, 640.0))
        assertEquals("640", dev.rinzai.zen.input.stepNumber("700", false, 0.0, 640.0))
    }
}
