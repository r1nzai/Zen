package dev.rinzai.zen.showcase.examples.breadcrumbs

import androidx.compose.runtime.Composable
import dev.rinzai.zen.breadcrumbs.Breadcrumbs

/** Parents as links, then the current page. */
@Composable
fun Default() {
    Breadcrumbs {
        crumb("Budgets") {}
        crumb("2026") {}
        current("September")
    }
}
