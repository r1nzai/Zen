package dev.rinzai.zen.showcase.examples.dialog

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Breakpoint
import dev.rinzai.zen.LocalPage
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.button.Button
import dev.rinzai.zen.button.ButtonVariant
import dev.rinzai.zen.combobox.Combobox
import dev.rinzai.zen.combobox.ComboboxEmpty
import dev.rinzai.zen.combobox.ComboboxList
import dev.rinzai.zen.combobox.ComboboxPopup
import dev.rinzai.zen.combobox.ComboboxSearch
import dev.rinzai.zen.combobox.ComboboxTrigger
import dev.rinzai.zen.datepicker.DatePicker
import dev.rinzai.zen.dialog.Dialog
import dev.rinzai.zen.dialog.DialogClose
import dev.rinzai.zen.dialog.DialogFooter
import dev.rinzai.zen.monthpicker.MonthPicker
import dev.rinzai.zen.select.Select
import dev.rinzai.zen.select.SelectItem
import dev.rinzai.zen.toast.LocalToaster
import dev.rinzai.zen.toast.ToastTone

private val CATEGORIES = listOf("groceries" to "Groceries", "rent" to "Rent", "transport" to "Transport", "dining" to "Dining out")
private val TAGS = listOf("Essential", "Shared", "Work", "Treat")

@Composable
private fun Labelled(label: String, modifier: Modifier = Modifier, content: @Composable () -> Unit) =
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, style = TextStyles.sm)
        content()
    }

/** Selects, pickers and menus open above the dialog, and toasts show over it (try Save draft). */
@Composable
fun Pickers() {
    val toast = LocalToaster.current
    var open by remember { mutableStateOf(false) }
    var category by remember { mutableStateOf<String?>("groceries") }
    var month by remember { mutableStateOf<String?>("2026-09") }
    var start by remember { mutableStateOf<String?>("2026-09-30") }
    var tags by remember { mutableStateOf(listOf(TAGS[0])) }
    Button({ open = true }) { Text("Add budget") }
    Dialog(open, { open = it }, title = "Add budget") {
        val categoryField = @Composable { m: Modifier ->
            Labelled("Category", m) {
                Select(category, { category = it }, Modifier.fillMaxWidth(), label = "Category") {
                    CATEGORIES.forEach { (value, label) -> SelectItem(value, label) }
                }
            }
        }
        val monthField = @Composable { m: Modifier ->
            Labelled("From", m) { MonthPicker(month, { month = it }, Modifier.fillMaxWidth(), locale = "en-IN", label = "From") }
        }
        if (LocalPage.current.atLeast(Breakpoint.Sm)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                categoryField(Modifier.weight(1f))
                monthField(Modifier.weight(1f))
            }
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                categoryField(Modifier)
                monthField(Modifier)
            }
        }
        Labelled("Starts on") { DatePicker(start, { start = it }, Modifier.fillMaxWidth(), locale = "en-IN", label = "Starts on") }
        Labelled("Tags") {
            Combobox(TAGS, tags, { tags = it }) {
                ComboboxTrigger(Modifier.fillMaxWidth())
                ComboboxPopup {
                    ComboboxSearch()
                    ComboboxList<String> { ComboboxEmpty() }
                }
            }
        }
        DialogFooter {
            Button({ toast("Draft saved") }, variant = ButtonVariant.Ghost) { Text("Save draft") }
            Spacer(Modifier.weight(1f))
            DialogClose(variant = ButtonVariant.Outline) { Text("Cancel") }
            DialogClose(onClick = { toast("Budget added", tone = ToastTone.Positive) }) { Text("Add") }
        }
    }
}
