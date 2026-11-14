package dev.rinzai.zen.showcase.examples.localeprovider

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.DateString
import dev.rinzai.zen.LocaleProvider
import dev.rinzai.zen.Messages
import dev.rinzai.zen.Money
import dev.rinzai.zen.Repeat
import dev.rinzai.zen.RepeatUnit
import dev.rinzai.zen.datepicker.DatePicker
import dev.rinzai.zen.field.Field
import dev.rinzai.zen.moneyinput.MoneyInput
import dev.rinzai.zen.repeatpicker.RepeatPicker

private object French : Messages() {
    override val pickDate = "Choisir une date"
    override val chooseDate = "Choisir la date"
    override val clear = "Effacer"
    override val previousMonth = "Mois précédent"
    override val nextMonth = "Mois suivant"
    override fun chooseMonthAndYear(month: String) = "$month, choisir le mois et l’année"
    override val enterAmount = "Saisissez un montant."
    override val repeats = "Répétition"
    override val every = "Tous les"
    override val next = "Prochaines :"
    override fun repeatUnit(unit: String, count: Int) =
        mapOf("day" to "jour", "week" to "semaine", "month" to "mois", "year" to "an").getValue(unit) + if (count > 1 && unit != "month") "s" else ""
    override fun repeatEvery(every: Int, unit: String) = if (every == 1) "Chaque $unit" else "Tous les $every $unit"
    override fun repeatOn(rule: String, `when`: String) = "$rule le $`when`"
}

/** `locale` sets how dates, numbers and money read, and the week's first day; `messages` gives the words. Anything you leave out stays English. */
@Composable
fun French() {
    var date by remember { mutableStateOf<DateString?>(null) }
    var amount by remember { mutableStateOf<Money?>(128050) }
    var repeat by remember { mutableStateOf(Repeat(2, RepeatUnit.Week)) }
    LocaleProvider("fr-FR", French) {
        Column(Modifier.width(320.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Field("Date") { DatePicker(date, { date = it }) }
            Field("Montant") { MoneyInput(amount, { amount = it }, "EUR") }
            RepeatPicker(repeat, { repeat = it }, start = "2026-10-12")
        }
    }
}
