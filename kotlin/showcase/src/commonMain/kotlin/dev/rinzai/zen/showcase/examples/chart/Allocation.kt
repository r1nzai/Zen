package dev.rinzai.zen.showcase.examples.chart

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.chart.AllocationBar
import dev.rinzai.zen.chart.AllocationItem
import dev.rinzai.zen.formatMoney

/** Where September's income went. */
@Composable
fun Allocation() {
    AllocationBar(
        label = "Income in September",
        modifier = Modifier.widthIn(max = 448.dp).fillMaxWidth(),
        locale = "en-US",
        formatValue = { formatMoney(it.toLong(), "USD", "en-US", showDecimals = false) },
        items = listOf(
            AllocationItem("bills", "Bills", 182000.0),
            AllocationItem("spending", "Spending", 145600.0),
            AllocationItem("savings", "Savings", 96000.0),
            AllocationItem("investing", "Investing", 50000.0),
            AllocationItem("left", "Left over", 26400.0),
        ),
    )
}
