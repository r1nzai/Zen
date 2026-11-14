package dev.rinzai.zen

import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusEventModifierNode
import androidx.compose.ui.focus.FocusRequesterModifierNode
import androidx.compose.ui.focus.FocusState
import androidx.compose.ui.focus.requestFocus
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.layout.LayoutCoordinates
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.node.CompositionLocalConsumerModifierNode
import androidx.compose.ui.node.GlobalPositionAwareModifierNode
import androidx.compose.ui.node.ModifierNodeElement
import androidx.compose.ui.node.currentValueOf

/**
 * Makes this control Page.activeElement while it has focus, as document.activeElement: a modal
 * opened from it grows out of it, and gives focus back to it as it closes. Goes before the
 * control's focus target (control() and fieldControl() put it there).
 */
internal fun Modifier.activeElement(): Modifier = this then ActiveElementElement

/** A focused control, as Page.activeElement holds it. */
internal class ActiveElement internal constructor(private val node: ActiveElementNode) {
    /** Where it is in the window, while it's on screen. */
    val bounds: Rect? get() = node.at?.takeIf { node.isAttached && it.isAttached }?.boundsInWindow()

    /** Focuses it again, if it's still there. */
    fun focus(): Boolean = node.isAttached && node.requestFocus()
}

private object ActiveElementElement : ModifierNodeElement<ActiveElementNode>() {
    override fun create() = ActiveElementNode()
    override fun update(node: ActiveElementNode) {}
    override fun hashCode() = 0
    override fun equals(other: Any?) = other === this
}

internal class ActiveElementNode : Modifier.Node(), FocusEventModifierNode, FocusRequesterModifierNode, GlobalPositionAwareModifierNode, CompositionLocalConsumerModifierNode {
    internal var at: LayoutCoordinates? = null
    private val handle = ActiveElement(this)

    override fun onGloballyPositioned(coordinates: LayoutCoordinates) {
        at = coordinates
    }

    // Read once attached: focus can be cleared from it as it's taken away, when it can't read locals.
    private var page: Page? = null

    override fun onAttach() {
        page = currentValueOf(LocalPage)
    }

    override fun onFocusEvent(focusState: FocusState) {
        val page = page ?: return
        if (focusState.isFocused) page.activeElement = handle
        else if (page.activeElement === handle) page.activeElement = null
    }

    override fun onDetach() {
        if (page?.activeElement === handle) page?.activeElement = null
    }
}
