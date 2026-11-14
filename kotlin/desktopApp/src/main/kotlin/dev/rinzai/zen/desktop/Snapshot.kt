package dev.rinzai.zen.desktop

import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.semantics.SemanticsActions
import androidx.compose.ui.semantics.SemanticsNode
import androidx.compose.ui.semantics.SemanticsOwner
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.semantics.getOrNull
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.Density
import dev.rinzai.zen.Appearance
import dev.rinzai.zen.showcase.MusicShowcase
import dev.rinzai.zen.showcase.Story
import dev.rinzai.zen.showcase.StoryLayout
import org.jetbrains.skia.EncodedImageFormat
import java.io.File

/**
 * Renders the showcase off screen to a PNG, for the parity check against the web's: `width
 * height out [dark|light] [x,y | h:x,y | w:x,y,dy | k:Key | t:text …]`, clicking (with h:, hovering;
 * with w:, turning the wheel dy notches; with k:, pressing the named key; with t:, filling the focused field with the text)
 * each point in turn once the page has loaded. Run with -Dzen.reducedMotion=true, as the web capture emulates, unless a step is `motion`.
 */
@OptIn(androidx.compose.ui.InternalComposeUiApi::class)
fun main(args: Array<String>) {
    val (w, h) = args[0].toInt() to args[1].toInt()
    val out = File(args[2])
    val appearance = if (args.getOrNull(3) == "light") Appearance.Light else Appearance.Dark
    // `motion` among the steps: animations run, as the web capture's does with it.
    if ("motion" in args.drop(4)) System.setProperty("zen.reducedMotion", "false")
    val story = System.getProperty("zen.story")
    val docs = System.getProperty("zen.docs").orEmpty()
    val scene = ImageComposeScene(w, h, Density(1f)) {
        if (docs.isNotEmpty()) Docs(DocPages.indexOfFirst { it.title == docs }) {}
        else if (story.isNullOrEmpty()) MusicShowcase(appearance) else Story(story, appearance, StoryLayout.valueOf(System.getProperty("zen.layout", "centered").replaceFirstChar { it.uppercase() }))
    }
    val dragY = HashMap<Offset, Float>()
    // A step may end in @ms: how long to run after it (600 otherwise).
    val steps = args.drop(4).filter { it != "motion" }.map { arg ->
        val a = arg.substringBefore("@")
        val wait = arg.substringAfter("@", "600").toLong() * 1_000_000L
        if (a.startsWith("k:") || a.startsWith("t:")) return@map Step(a, Offset.Zero, 0f, wait)
        val n = a.substringAfter(":").split(",").map { it.toFloat() }
        if (n.size == 4) dragY[Offset(n[0], n[1])] = n[3]
        Step(a.substringBefore(":", ""), Offset(n[0], n[1]), n.getOrElse(2) { 0f }, wait)
    }
    // Frames over 2.5s of wall time: fonts and the contour image load off the UI thread.
    var image = scene.render(0)
    val start = System.nanoTime()
    fun run(nanos: Long) {
        val until = System.nanoTime() + nanos
        while (System.nanoTime() < until) {
            image = scene.render(System.nanoTime() - start)
            Thread.sleep(16)
        }
    }
    run(2_500_000_000L)
    // From here time is the frames': 16ms each, however long one takes to draw, so a capture mid-animation is the same every run.
    var now = System.nanoTime() - start
    fun frames(nanos: Long) {
        val until = now + nanos
        while (now < until) {
            now += 16_000_000L
            image = scene.render(now)
        }
    }
    for ((kind, at, dy, wait) in steps) {
        if (kind.startsWith("t:")) {
            // As Playwright's fill: the focused field's text replaced (key events carry no text off screen).
            val field = scene.semanticsOwners.firstNotNullOfOrNull { owner ->
                owner.unmergedRootSemanticsNode.find { it.config.getOrNull(SemanticsProperties.Focused) == true && it.config.getOrNull(SemanticsActions.SetText) != null }
            } ?: error("Nothing focused takes text")
            field.config[SemanticsActions.SetText].action!!(AnnotatedString(kind.removePrefix("t:")))
            frames(wait)
            continue
        }
        if (kind.startsWith("k:")) {
            val name = kind.removePrefix("k:")
            // Modifiers as Playwright names them: Shift+, Control+, Meta+ before the key.
            val mods = name.split("+").dropLast(1).toSet()
            val bare = name.substringAfterLast("+").ifEmpty { "+" }
            // One character is typed: its key, with the character it gives.
            val char = bare.singleOrNull()
            val key = if (char != null) Key(java.awt.event.KeyEvent.getExtendedKeyCodeForChar(char.uppercaseChar().code)) else KEYS.getValue(bare)
            val typed = if (char != null && mods.none { it == "Control" || it == "Meta" }) char.code else 0
            for (type in listOf(KeyEventType.KeyDown, KeyEventType.KeyUp)) {
                scene.sendKeyEvent(KeyEvent(key, type, codePoint = typed, isShiftPressed = "Shift" in mods, isCtrlPressed = "Control" in mods, isMetaPressed = "Meta" in mods))
            }
            frames(wait)
            println("focus $name: ${focused(scene.semanticsOwners)}")
            continue
        }
        if (kind == "d" || kind == "g") {
            // A drag from `at` to the step's second point, in ten moves; g: holds on at the end.
            val to = Offset(dy, dragY.getValue(at))
            scene.sendPointerEvent(PointerEventType.Move, at)
            frames(16_000_000L)
            scene.sendPointerEvent(PointerEventType.Press, at)
            frames(16_000_000L)
            for (i in 1..10) {
                scene.sendPointerEvent(PointerEventType.Move, at + (to - at) * (i / 10f))
                frames(16_000_000L)
            }
            // g: holds on.
            if (kind == "d") scene.sendPointerEvent(PointerEventType.Release, to)
            frames(wait)
            continue
        }
        scene.sendPointerEvent(PointerEventType.Move, at)
        if (kind == "w") scene.sendPointerEvent(PointerEventType.Scroll, at, scrollDelta = Offset(0f, dy))
        else if (kind != "h") {
            scene.sendPointerEvent(PointerEventType.Press, at)
            scene.sendPointerEvent(PointerEventType.Release, at)
        }
        frames(wait)
    }
    out.writeBytes(image.encodeToData(EncodedImageFormat.PNG)!!.bytes)
    scene.close()
}

// What has focus, as assistive tech would name it: the nearest labelled node at or around it, and where it is.
internal fun focused(owners: Collection<SemanticsOwner>): String {
    for (owner in owners) {
        val node = owner.unmergedRootSemanticsNode.find { it.config.getOrNull(SemanticsProperties.Focused) == true } ?: continue
        var n: SemanticsNode? = node
        while (n != null) {
            val c = n.config
            val label = c.getOrNull(SemanticsProperties.ContentDescription)?.joinToString()
                ?: c.getOrNull(SemanticsProperties.Text)?.joinToString()
                ?: n.children.firstNotNullOfOrNull { ch -> ch.config.getOrNull(SemanticsProperties.Text)?.joinToString() }
            if (label != null) return "$label ${node.boundsInRoot}"
            n = n.parent
        }
        return "? ${node.boundsInRoot}"
    }
    return "none"
}

private fun SemanticsNode.find(test: (SemanticsNode) -> Boolean): SemanticsNode? =
    if (test(this)) this else children.firstNotNullOfOrNull { it.find(test) }

private data class Step(val kind: String, val at: Offset, val dy: Float, val wait: Long)

private val KEYS = mapOf(
    "Escape" to Key.Escape, "Tab" to Key.Tab, "Enter" to Key.Enter, "Space" to Key.Spacebar,
    "Up" to Key.DirectionUp, "Down" to Key.DirectionDown, "Left" to Key.DirectionLeft, "Right" to Key.DirectionRight,
    "Delete" to Key.Delete, "Backspace" to Key.Backspace,
    "ArrowUp" to Key.DirectionUp, "ArrowDown" to Key.DirectionDown, "ArrowLeft" to Key.DirectionLeft, "ArrowRight" to Key.DirectionRight,
)
