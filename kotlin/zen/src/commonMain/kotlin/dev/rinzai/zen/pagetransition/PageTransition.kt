package dev.rinzai.zen.pagetransition

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import dev.rinzai.zen.ViewTransitionStyle
import dev.rinzai.zen.viewTransition

/**
 * The page's content, which changes between pages: wrap what your navigation swaps in it, and
 * change page in a view transition (`Zen.viewTransition.start { page = next }`): the old page fades
 * out as the new one rises in, while everything outside (header, nav) stays still. One per page.
 */
@Composable
fun PageTransition(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.viewTransition("zen-page", ViewTransitionStyle.Page), content = content)
}
