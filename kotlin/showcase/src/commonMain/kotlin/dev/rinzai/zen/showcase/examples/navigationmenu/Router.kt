package dev.rinzai.zen.showcase.examples.navigationmenu

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.navigationmenu.NavigationMenu
import dev.rinzai.zen.navigationmenu.NavigationMenuContent
import dev.rinzai.zen.navigationmenu.NavigationMenuItem
import dev.rinzai.zen.navigationmenu.NavigationMenuLink
import dev.rinzai.zen.navigationmenu.NavigationMenuTrigger

private val ACCOUNTS = listOf("Everyday", "Savings", "Credit card")

/** With your router: each link's `onClick` navigates, and `active` follows the page. */
@Composable
fun Router() {
    var page by remember { mutableStateOf("Everyday") }
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
        NavigationMenu(label = "Accounts") {
            NavigationMenuItem {
                NavigationMenuTrigger { Text("Accounts") }
                NavigationMenuContent(Modifier.width(192.dp)) {
                    Column {
                        for (name in ACCOUNTS) NavigationMenuLink({ page = name }, Modifier.fillMaxWidth(), active = page == name) { Text(name) }
                    }
                }
            }
        }
        Text("Showing $page", style = TextStyles.sm, color = Zen.tokens.mutedForeground.color())
    }
}
