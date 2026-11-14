package dev.rinzai.zen.showcase.examples.localeprovider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateString
import dev.rinzai.zen.LocaleProvider
import dev.rinzai.zen.Messages
import dev.rinzai.zen.Text
import dev.rinzai.zen.calendar.Calendar
import dev.rinzai.zen.pagination.Pagination
import dev.rinzai.zen.slider.Slider
import dev.rinzai.zen.tabs.Tab
import dev.rinzai.zen.tabs.TabList
import dev.rinzai.zen.tabs.Tabs
import dev.rinzai.zen.tabs.rememberTabsState

private object Arabic : Messages() {
    override val previousPage = "الصفحة السابقة"
    override val nextPage = "الصفحة التالية"
}

/** Right to left: provide LayoutDirection.Rtl for the page (or any part of it). Layout, arrow keys and arrows follow; LocaleProvider gives the locale and words. */
@Composable
fun RightToLeft() {
    var page by remember { mutableIntStateOf(2) }
    var date by remember { mutableStateOf<DateString?>("2026-10-12") }
    var budget by remember { mutableFloatStateOf(30f) }
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        LocaleProvider("ar-EG", Arabic) {
            Column(Modifier.width(320.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                Tabs(rememberTabsState("month")) {
                    TabList {
                        Tab("month") { Text("الشهر") }
                        Tab("year") { Text("السنة") }
                    }
                }
                Calendar(date, { date = it })
                Slider(budget, { budget = it }, label = "الميزانية")
                Pagination(page, 5, { page = it })
            }
        }
    }
}
