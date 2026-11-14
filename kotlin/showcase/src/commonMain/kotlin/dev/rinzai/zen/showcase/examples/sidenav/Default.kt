package dev.rinzai.zen.showcase.examples.sidenav

import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Text
import dev.rinzai.zen.sidenav.SideNav
import dev.rinzai.zen.sidenav.SideNavGroup
import dev.rinzai.zen.sidenav.SideNavLink

private val GROUPS = listOf(
    "Account" to listOf("Profile", "Security", "Passkeys"),
    "Workspace" to listOf("Members", "Billing", "Integrations"),
)

@Composable
fun Default() {
    var current by remember { mutableStateOf("Security") }
    SideNav(Modifier.width(224.dp), label = "Settings") {
        for ((title, links) in GROUPS) {
            SideNavGroup(title = title) {
                for (link in links) SideNavLink({ current = link }, active = link == current) { Text(link) }
            }
        }
    }
}
