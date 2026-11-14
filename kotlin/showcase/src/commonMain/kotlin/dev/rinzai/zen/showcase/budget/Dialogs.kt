package dev.rinzai.zen.showcase.budget

import dev.rinzai.zen.ScrollArea
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.Money
import dev.rinzai.zen.Month
import dev.rinzai.zen.Repeat
import dev.rinzai.zen.Sides
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.alert.AlertTone
import dev.rinzai.zen.box
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonSize
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.combobox.Combobox
import dev.rinzai.zen.combobox.ComboboxEmpty
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.field.FormMessage
import dev.rinzai.zen.filedrop.FileDrop
import dev.rinzai.zen.input.Input
import dev.rinzai.zen.moneyinput.MoneyInput
import dev.rinzai.zen.monthpicker.MonthPicker
import dev.rinzai.zen.radii
import dev.rinzai.zen.repeatpicker.RepeatPicker
import dev.rinzai.zen.segmented.Segmented
import dev.rinzai.zen.stepper.Stepper
import dev.rinzai.zen.taginput.TagInput
import dev.rinzai.zen.textarea.Textarea
import dev.rinzai.zen.toggle.Toggle
import kotlinx.coroutines.launch

private class Form(
    val label: String = "",
    val amount: Money? = null,
    val kind: Kind = Kind.Expense,
    val category: String = "groceries",
    val tags: List<String> = emptyList(),
    val month: Month? = "2026-09",
    val repeat: Repeat? = null,
    val note: String = "",
) {
    fun copy(
        label: String = this.label,
        amount: Money? = this.amount,
        kind: Kind = this.kind,
        category: String = this.category,
        tags: List<String> = this.tags,
        month: Month? = this.month,
        repeat: Repeat? = this.repeat,
        note: String = this.note,
    ) = Form(label, amount, kind, category, tags, month, repeat, note)
}

/** Two fields side by side from sm up (`ratio` of the first to the second), else stacked. */
@Composable
private fun Fields(ratio: Float, first: @Composable (Modifier) -> Unit, second: @Composable (Modifier) -> Unit) {
    if (Zen.page.atLeast(Breakpoint.Sm)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            first(Modifier.weight(ratio))
            second(Modifier.weight(1f))
        }
    } else {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            first(Modifier)
            second(Modifier)
        }
    }
}

@Composable
private fun Footer(content: @Composable () -> Unit) =
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.End)) { content() }

@Composable
internal fun AddEntryDialog(open: Boolean, onOpenChange: (Boolean) -> Unit, onAdd: (Entry) -> Unit) {
    var form by remember { mutableStateOf(Form()) }
    var submitted by remember { mutableStateOf(false) }
    val labelError = if (form.label.isBlank()) "Describe the entry." else null
    val amountError = if (form.amount == null || form.amount!! <= 0) "Enter an amount above zero." else null
    val valid = labelError == null && amountError == null
    val close = {
        onOpenChange(false)
        form = Form()
        submitted = false
    }
    val submit = {
        submitted = true
        if (valid) {
            onAdd(Entry(0, form.label.trim(), form.amount!!, form.kind, form.category, form.tags, form.repeat))
            close()
        }
    }
    Dialog(open, { if (it) onOpenChange(true) else close() }, title = "Add entry", description = "Amounts are in US dollars.") {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Segmented(form.kind, { form = form.copy(kind = it) }, label = "Type") {
                SegmentedItem(Kind.Expense) { Text("Expense") }
                SegmentedItem(Kind.Income) { Text("Income") }
            }
            Fields(
                1.5f,
                { m ->
                    Field("Description", m, error = if (submitted) labelError else null) {
                        Input(form.label, { form = form.copy(label = it) }, Modifier.fillMaxWidth(), placeholder = "Weekly shop")
                    }
                },
                { m ->
                    Field("Amount", m, hint = "Sums work too: 12.50+4", error = if (submitted) amountError else null) {
                        MoneyInput(form.amount, { form = form.copy(amount = it) }, CURRENCY, Modifier.fillMaxWidth(), locale = LOCALE, allowEmpty = true, live = true)
                    }
                },
            )
            Fields(
                1f,
                { m ->
                    Column(m, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Category", style = TextStyles.sm.merge(TextStyles.medium))
                        Combobox(CATEGORIES, form.category, { form = form.copy(category = it) }, itemText = { it.label }, itemKey = { it.value }) {
                            ComboboxTrigger(Modifier.fillMaxWidth())
                            ComboboxPopup {
                                ComboboxSearch("Search categories")
                                ComboboxList<Category> { ComboboxEmpty { Text("No category by that name") } }
                            }
                        }
                    }
                },
                { m ->
                    Field("Month", m) { MonthPicker(form.month, { form = form.copy(month = it) }, Modifier.fillMaxWidth(), locale = LOCALE) }
                },
            )
            Field("Tags", hint = "Press Enter or a comma after each.") {
                TagInput(form.tags, { form = form.copy(tags = it) }, Modifier.fillMaxWidth(), placeholder = "Shared, Work…")
            }
            Field("Note", hint = "Only you can see this.") {
                Textarea(form.note, { form = form.copy(note = it) }, Modifier.fillMaxWidth(), placeholder = "Optional")
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text("Repeats", style = TextStyles.sm)
                Toggle(form.repeat != null, { form = form.copy(repeat = if (it) MONTHLY else null) }, label = "Repeats")
            }
            form.repeat?.let { repeat ->
                RepeatPicker(repeat, { form = form.copy(repeat = it) }, locale = LOCALE, start = "${form.month ?: "2026-09"}-01", label = "How often")
            }
            if (submitted && !valid) FormMessage(tone = AlertTone.Negative) { Text("Fix the fields above to add it.") }
            Footer {
                Button(close, variant = ButtonVariant.Outline) { Text("Cancel") }
                Button(submit) { Text("Add entry") }
            }
        }
    }
}

private class Found(val rows: List<Entry>, val from: String)

/** A bank statement in three steps: choose the file, check what was found, and done. */
@Composable
internal fun ImportDialog(open: Boolean, onOpenChange: (Boolean) -> Unit, onImport: (List<Entry>, String) -> Unit) {
    val t = Zen.tokens
    val scope = rememberCoroutineScope()
    var step by remember { mutableIntStateOf(0) }
    var found by remember { mutableStateOf<Found?>(null) }
    var problem by remember { mutableStateOf<String?>(null) }
    val read = { text: String, from: String ->
        val rows = parseStatement(text)
        if (rows.isEmpty()) problem = "No rows with an amount in $from."
        else {
            problem = null
            found = Found(rows, from)
            step = 1
        }
    }
    val close = {
        onOpenChange(false)
        step = 0
        found = null
        problem = null
    }
    Dialog(open, { if (it) onOpenChange(true) else close() }, title = "Import a statement", description = "Entries from your bank's CSV, added to this month.") {
        Stepper(step, Modifier.padding(vertical = 8.dp)) {
            step("Upload")
            step("Review")
            step("Done")
        }
        val muted = t.mutedForeground.color()
        when (step) {
            0 -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                FileDrop({ files -> files.firstOrNull()?.let { f -> scope.launch { read(f.read().decodeToString(), f.name) } } }, accept = ".csv,text/csv") {
                    Text("Drop a statement here", style = TextStyles.medium, color = t.foreground.color())
                    Text("A CSV file, or click to choose one", style = TextStyles.xs)
                }
                problem?.let { FormMessage(tone = AlertTone.Negative) { Text(it) } }
                Button({ read(SAMPLE_STATEMENT, "the sample") }, Modifier.align(Alignment.CenterHorizontally), variant = ButtonVariant.Ghost, size = ButtonSize.Sm) {
                    Text("Use a sample statement")
                }
            }
            1 -> found?.let { f ->
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("${f.rows.size} entries in ${f.from}:", style = TextStyles.sm, color = muted)
                    val shape = Zen.radii.lg
                    ScrollArea(
                        Modifier
                            .fillMaxWidth()
                            .box(shape, border = SolidColor(t.tint.color(0.1f)))
                            .heightIn(max = 224.dp),
                        vertical = rememberScrollState(),
                    ) { Column {
                        f.rows.forEachIndexed { i, e ->
                            Row(
                                Modifier
                                    .fillMaxWidth()
                                    .box(RectangleShape, border = if (i > 0) SolidColor(t.tint.color(0.07f)) else null, sides = Sides.Top)
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Column(Modifier.weight(1f)) {
                                    Text(e.label, style = TextStyles.sm.merge(TextStyles.medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text(categoryOf(e.category).label, style = TextStyles.xs, color = muted)
                                }
                                val income = e.kind == Kind.Income
                                Text(
                                    (if (income) "+" else "−") + money(e.amount),
                                    style = TextStyles.sm.merge(TextStyles.tabular),
                                    color = if (income) t.primary.color() else t.foreground.color(),
                                )
                            }
                        }
                    }}
                    Footer {
                        Button({ step = 0 }, variant = ButtonVariant.Outline) { Text("Back") }
                        Button({
                            onImport(f.rows, f.from)
                            step = 3
                        }) { Text("Import ${f.rows.size} entries") }
                    }
                }
            }
            else -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("${found?.rows?.size} entries added to this month.", style = TextStyles.sm)
                Button(close, Modifier.align(Alignment.End)) { Text("Done") }
            }
        }
    }
}
