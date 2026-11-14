package dev.rinzai.zen.showcase.budget

import dev.rinzai.zen.Money
import dev.rinzai.zen.Repeat
import dev.rinzai.zen.RepeatUnit
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.now
import dev.rinzai.zen.timefield.formatTime
import kotlin.math.abs
import kotlin.math.roundToInt
import kotlin.math.roundToLong

/*
 * A small budget app built only from Zen: a sortable, paged entries table you can edit in place,
 * spending by group in a tree with meters, recent activity, goals that open into their details, a
 * live theme editor, a statement import, a command palette (⌘K), and dialogs with every kind of
 * field. Amounts are integer cents.
 */

enum class Kind { Expense, Income }

class Category(val value: String, val label: String, val group: String, val budget: Money)

data class Entry(
    val id: Int,
    val label: String,
    val amount: Money,
    val kind: Kind,
    val category: String,
    val tags: List<String>,
    val repeat: Repeat? = null,
)

val CATEGORIES = listOf(
    Category("salary", "Salary", "Income", 0),
    Category("rent", "Rent", "Essentials", 185000),
    Category("groceries", "Groceries", "Essentials", 60000),
    Category("transport", "Transport", "Essentials", 12000),
    Category("dining", "Dining out", "Lifestyle", 15000),
    Category("subscriptions", "Subscriptions", "Lifestyle", 4000),
    Category("travel", "Travel", "Lifestyle", 30000),
)
val MONTHLY = Repeat(1, RepeatUnit.Month)
fun categoryOf(key: String) = CATEGORIES.first { it.value == key }

/** Words in an imported row's description that say which category it is. */
private val CATEGORY_WORDS = listOf(
    "rent" to Regex("rent|landlord|lettings", RegexOption.IGNORE_CASE),
    "groceries" to Regex("grocer|market|supermarket|shop", RegexOption.IGNORE_CASE),
    "transport" to Regex("train|bus|metro|taxi|uber|fuel|parking", RegexOption.IGNORE_CASE),
    "dining" to Regex("restaurant|cafe|coffee|dinner|lunch|bar|pizza", RegexOption.IGNORE_CASE),
    "subscriptions" to Regex("subscription|streaming|music|netflix|spotify|cloud", RegexOption.IGNORE_CASE),
    "travel" to Regex("flight|hotel|airline|airbnb|travel", RegexOption.IGNORE_CASE),
)

val INITIAL = listOf(
    Entry(1, "Paycheck", 845000, Kind.Income, "salary", listOf("Work"), MONTHLY),
    Entry(2, "Rent", 185000, Kind.Expense, "rent", listOf("Essential", "Shared"), MONTHLY),
    Entry(3, "Weekly shop", 16450, Kind.Expense, "groceries", listOf("Essential", "Shared", "Cash", "Reimbursable")),
    Entry(4, "Farmers market", 4200, Kind.Expense, "groceries", listOf("Cash")),
    Entry(5, "Train pass", 9200, Kind.Expense, "transport", listOf("Work"), MONTHLY),
    Entry(6, "Dinner with Sam", 7800, Kind.Expense, "dining", listOf("Treat")),
    Entry(7, "Birthday lunch", 9150, Kind.Expense, "dining", listOf("Treat", "Shared")),
    Entry(8, "Music streaming", 1199, Kind.Expense, "subscriptions", emptyList(), MONTHLY),
    Entry(9, "Flights to Lisbon", 41200, Kind.Expense, "travel", listOf("Treat", "Annual")),
    Entry(10, "Freelance invoice", 120000, Kind.Income, "salary", listOf("Work")),
)

const val CURRENCY = "USD"
const val LOCALE = "en-US"
fun money(m: Money) = formatMoney(m, CURRENCY, LOCALE, showDecimals = false)
fun signed(e: Entry) = if (e.kind == Kind.Income) e.amount else -e.amount
fun stamp() = "Today, ${formatTime(now(), LOCALE)}"

/** The months before this one, in dollars: where the stats' trend lines come from. */
val INCOME_BEFORE = listOf(8100.0, 8300.0, 7900.0, 8600.0, 8200.0, 8450.0, 9300.0)
val SPENT_BEFORE = listOf(5400.0, 5900.0, 5200.0, 6100.0, 5600.0, 5800.0, 5100.0)

data class Activity(val id: Long, val title: String, val detail: String?, val time: String)

val EARLIER = listOf(
    Activity(-1, "Paycheck received", "+$8,450 from Northwind", "1 Sep"),
    Activity(-2, "Rent paid", "−$1,850 to Northside Lettings", "1 Sep"),
    Activity(-3, "Goal reached 60%", "Emergency fund", "28 Aug"),
    Activity(-4, "Budget changed", "Dining out: $120 → $150", "24 Aug"),
    Activity(-5, "Statement imported", "14 entries from Northwind Bank", "20 Aug"),
    Activity(-6, "Entry deleted", "Duplicate train pass", "18 Aug"),
    Activity(-7, "Goal added", "New laptop, $2,000", "12 Aug"),
)

class Goal(val id: String, val name: String, val saved: Money, val target: Money, val history: List<Double>) {
    val percent get() = (saved * 100.0 / target).roundToInt()
}

val GOALS = listOf(
    Goal("emergency", "Emergency fund", 640000, 1000000, listOf(3800.0, 4300.0, 4900.0, 5400.0, 5900.0, 6400.0)),
    Goal("laptop", "New laptop", 56000, 200000, listOf(0.0, 100.0, 210.0, 300.0, 420.0, 560.0)),
    Goal("holiday", "Summer holiday", 31000, 250000, listOf(0.0, 0.0, 60.0, 140.0, 220.0, 310.0)),
)

class GoalIcon(val value: String, val label: String, val icon: String)

val GOAL_ICONS = listOf(
    GoalIcon("lifebuoy", "Safety net", "🛟"),
    GoalIcon("laptop", "Laptop", "💻"),
    GoalIcon("beach", "Holiday", "🏖️"),
    GoalIcon("home", "Home", "🏠"),
    GoalIcon("car", "Car", "🚗"),
    GoalIcon("study", "Study", "🎓"),
    GoalIcon("gift", "Gift", "🎁"),
    GoalIcon("plane", "Travel", "✈️"),
    GoalIcon("ring", "Wedding", "💍"),
    GoalIcon("pet", "Pet", "🐾"),
    GoalIcon("books", "Books", "📚"),
    GoalIcon("savings", "Savings", "💰"),
)
fun iconOf(value: String) = GOAL_ICONS.first { it.value == value }.icon

const val SAMPLE_STATEMENT = """Date,Description,Amount
2026-09-03,Corner Market,-38.40
2026-09-05,City Metro top-up,-25.00
2026-09-08,Cafe Aurora,-14.60
2026-09-12,Cloud storage subscription,-2.99
2026-09-15,Expense refund,62.00
2026-09-19,Pizza night,-31.80"""

private val AMOUNT = Regex("""^[-−+]?\s*[$€£]?\s*[\d,]*\.?\d+$""")
private val NUMBERISH = Regex("""^[\d\s./-]+$""")

/** Rows with a description and an amount, from a bank's CSV: spending is negative. */
fun parseStatement(text: String): List<Entry> = text.split(Regex("\r?\n")).mapNotNull { line ->
    val cells = line.split(',').map { it.trim().removePrefix("\"").removeSuffix("\"") }
    val amountCell = cells.firstOrNull { AMOUNT.matches(it) } ?: return@mapNotNull null
    val label = cells.firstOrNull { it.isNotEmpty() && it != amountCell && !NUMBERISH.matches(it) } ?: return@mapNotNull null
    val value = amountCell.replaceFirst('−', '-').replace(Regex("[^\\d.-]"), "").toDoubleOrNull()
    if (value == null || !value.isFinite() || value == 0.0) return@mapNotNull null
    val kind = if (value < 0) Kind.Expense else Kind.Income
    val category = if (kind == Kind.Income) "salary" else CATEGORY_WORDS.firstOrNull { (_, words) -> words.containsMatchIn(label) }?.first ?: "groceries"
    Entry(0, label, (abs(value) * 100).roundToLong(), kind, category, emptyList())
}
