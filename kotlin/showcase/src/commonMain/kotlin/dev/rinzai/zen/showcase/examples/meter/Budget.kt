package dev.rinzai.zen.showcase.examples.meter

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.meter.Meter

private fun inr(paise: Long) = formatMoney(paise, "INR", "en-IN", showDecimals = false)

/** Spend against a budget: the bar warms near the limit and turns red past it. */
@Composable
fun Budget() {
    val budgets = listOf(
        Triple("Groceries", 620000L, 1000000L),
        Triple("Dining out", 270000L, 300000L),
        Triple("Transport", 410000L, 350000L),
    )
    Column(Modifier.width(320.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        for ((label, spent, budget) in budgets) {
            val status = if (spent > budget) "${inr(spent - budget)} over" else "${inr(budget - spent)} left"
            Meter(
                spent.toDouble(),
                label = label,
                max = budget.toDouble(),
                detail = "${inr(spent)} / ${inr(budget)}",
                hint = status,
                valueText = "${inr(spent)} of ${inr(budget)}, $status",
            )
        }
    }
}
