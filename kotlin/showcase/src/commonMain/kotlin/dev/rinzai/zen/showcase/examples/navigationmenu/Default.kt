package dev.rinzai.zen.showcase.examples.navigationmenu

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.navigationmenu.NavigationMenu
import dev.rinzai.zen.navigationmenu.NavigationMenuContent
import dev.rinzai.zen.navigationmenu.NavigationMenuItem
import dev.rinzai.zen.navigationmenu.NavigationMenuLink
import dev.rinzai.zen.navigationmenu.NavigationMenuTrigger

private val PLAN = listOf(
    "Budgets" to "Limits for each category, month by month.",
    "Goals" to "Savings with a target and a date.",
    "Bills" to "What's due, and when it repeats.",
    "Planner" to "The year ahead, item by item.",
)

/**
 * A site's top navigation: rest the pointer on Plan or Reports (or click, or Tab to one and press
 * Enter) for its panel; once one is open, moving to the other moves the panel on to it at once.
 */
@Composable
fun Default() {
    NavigationMenu(label = "Site") {
        NavigationMenuItem { NavigationMenuLink({}, active = true) { Text("Overview") } }
        NavigationMenuItem {
            NavigationMenuTrigger { Text("Plan") }
            NavigationMenuContent(Modifier.width(416.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    for (row in PLAN.chunked(2)) Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        for ((name, about) in row) NavigationMenuLink({}, Modifier.weight(1f), description = about) { Text(name) }
                    }
                }
            }
        }
        NavigationMenuItem {
            NavigationMenuTrigger { Text("Reports") }
            NavigationMenuContent(Modifier.width(240.dp)) {
                Column {
                    for (name in listOf("Spending", "Income", "Net worth")) NavigationMenuLink({}) { Text(name) }
                }
            }
        }
        NavigationMenuItem { NavigationMenuLink({}) { Text("Help") } }
    }
}
