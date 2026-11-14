package dev.rinzai.zen.moneyinput

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Stable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.layout.layout
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import dev.rinzai.zen.Chevron
import dev.rinzai.zen.DateStyle
import dev.rinzai.zen.FieldSize
import dev.rinzai.zen.ForeignAmount
import dev.rinzai.zen.Icon
import dev.rinzai.zen.LocalMessages
import dev.rinzai.zen.Messages
import dev.rinzai.zen.Money
import dev.rinzai.zen.NumberOptions
import dev.rinzai.zen.PopupAlign
import dev.rinzai.zen.ProvideText
import dev.rinzai.zen.RateTable
import dev.rinzai.zen.Text
import dev.rinzai.zen.TextStyles
import dev.rinzai.zen.Zen
import dev.rinzai.zen.box
import dev.rinzai.zen.control
import dev.rinzai.zen.convertMinor
import dev.rinzai.zen.currencyDigits
import dev.rinzai.zen.currencySymbol
import dev.rinzai.zen.field.FieldError
import dev.rinzai.zen.focusRing
import dev.rinzai.zen.formatAmount
import dev.rinzai.zen.formatDate
import dev.rinzai.zen.formatMoney
import dev.rinzai.zen.formatNumber
import dev.rinzai.zen.icons.Icons
import dev.rinzai.zen.input.InputGroup
import dev.rinzai.zen.input.InputGroupAddon
import dev.rinzai.zen.input.InputGroupInput
import dev.rinzai.zen.input.InputType
import dev.rinzai.zen.locale
import dev.rinzai.zen.menu.MenuContent
import dev.rinzai.zen.menu.MenuItem
import dev.rinzai.zen.menu.MenuSeparator
import dev.rinzai.zen.menu.menuTrigger
import dev.rinzai.zen.menu.rememberMenuState
import dev.rinzai.zen.parseMoneyInput
import dev.rinzai.zen.radii
import dev.rinzai.zen.rateBetween
import dev.rinzai.zen.rememberControlState
import dev.rinzai.zen.spinner.Spinner
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlin.math.floor
import kotlin.math.log10

/**
 * Amount input in one currency. Shows grouped digits for the locale (1,52,000
 * for en-IN) and accepts shorthand: 1.5L, 2cr, 10k, 1.2m, and sums: 120+45.50,
 * 3*12.99. Commits on leaving it or Enter; Escape reverts. Values are integer minor
 * units (paise, cents), or null when empty.
 *
 * With `convert`, the symbol becomes a currency switch: type an amount in e.g.
 * USD and it's converted at the rates you load (on the device; the amount is
 * never sent anywhere). Replace the symbol with `start`, or build your own field
 * from rememberMoneyInput, MoneyCurrencyMenu and MoneyConversionHint.
 */
@Composable
fun MoneyInput(
    value: Money?,
    onValueChange: (Money?) -> Unit,
    currency: String,
    modifier: Modifier = Modifier,
    locale: String? = null,
    allowNegative: Boolean = false,
    allowEmpty: Boolean = false,
    live: Boolean = false,
    onCancel: (() -> Unit)? = null,
    convert: CurrencyConversion? = null,
    start: (@Composable RowScope.() -> Unit)? = null,
    end: (@Composable RowScope.() -> Unit)? = null,
    compact: Boolean = false,
    size: FieldSize = FieldSize.Default,
    enabled: Boolean = true,
    label: String? = null,
    placeholder: String? = null,
) {
    val money = rememberMoneyInput(value, onValueChange, currency, locale, allowNegative, allowEmpty, live, onCancel, convert)
    val foreign = money.conversion?.foreign == true
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        InputGroup(
            if (compact) Modifier.height(28.dp) else Modifier,
            size,
            invalid = money.error != null,
            border = if (foreign) Zen.tokens.primary.color(0.5f) else null,
        ) {
            when {
                start != null -> start()
                money.conversion != null && enabled -> MoneyCurrencyMenu(money)
                else -> InputGroupAddon(Modifier.clearAndSetSemantics {}) { Text(money.symbol) }
            }
            InputGroupInput(
                money.text,
                money::onTextChange,
                Modifier.moneyInput(money),
                placeholder,
                label,
                InputType.Decimal,
                enabled,
                TextStyles.tabular.merge(TextStyle(textAlign = if (compact) TextAlign.End else TextAlign.Start)),
            )
            end?.invoke(this)
        }
        val error = money.error
        if (error != null) FieldError(error) else MoneyConversionHint(money)
    }
}

/**
 * The currency switch for a converting field (`convert`): shows the symbol, or
 * the code of the foreign currency being typed in, and opens a menu of your
 * currency and the ones with a rate. Put it at an InputGroup's start.
 */
@Composable
fun MoneyCurrencyMenu(money: MoneyInputState, modifier: Modifier = Modifier) {
    val c = money.conversion ?: return
    val m = LocalMessages.current
    val t = Zen.tokens
    val menu = rememberMenuState()
    val state = rememberControlState()
    val color = if (c.foreign) t.primary.color() else t.mutedForeground.color()
    Row(
        modifier
            // -ms-1: into the field's padding.
            .layout { measurable, constraints ->
                val p = measurable.measure(constraints)
                val nudge = 4.dp.roundToPx()
                layout(p.width - nudge, p.height) { p.placeRelative(-nudge, 0) }
            }
            .menuTrigger(menu)
            .box(Zen.radii.md, fill = SolidColor(t.tint.color(if (state.hovered) 0.07f else 0f)), shadows = focusRing(state.focusVisible))
            .control(state, label = m.changeCurrency(c.currency), onClick = menu::toggle)
            .semantics { contentDescription = m.changeCurrency(c.currency) }
            .padding(horizontal = 4.dp, vertical = 2.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = color, style = TextStyles.sm) {
            Text(if (c.foreign) c.currency else money.symbol)
            Chevron(if (menu.open) 180f else 0f, color = color, duration = 150)
        }
    }
    MenuContent(menu, Modifier.width(240.dp).heightIn(max = 288.dp), align = PopupAlign.Start, offset = 8.dp, label = m.currency) {
        val item = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
        MenuItem({ c.pick(c.home) }, label = c.home, padding = item, spacing = 8.dp) {
            Text(c.home, Modifier.width(36.dp), style = TextStyles.medium)
            Text(m.yourCurrency, color = t.mutedForeground.color())
        }
        MenuSeparator()
        Text(m.otherCurrencies, Modifier.padding(start = 12.dp, end = 12.dp, top = 4.dp, bottom = 6.dp), style = TextStyles.xs, color = t.mutedForeground.color())
        for (code in c.choices) {
            MenuItem({ c.pick(code) }, label = code, padding = item, spacing = 8.dp) {
                Text(code, Modifier.width(36.dp), style = TextStyles.medium)
                Text(currencySymbol(code, "en"), color = t.mutedForeground.color())
            }
        }
    }
}

/**
 * The line under a converting field: getting the rate, the rate and what the
 * typed amount comes to, or what the last amount was converted from.
 */
@Composable
fun MoneyConversionHint(money: MoneyInputState, modifier: Modifier = Modifier) {
    val c = money.conversion ?: return
    val from = c.converted
    if (!c.foreign && from == null) return
    val m = LocalMessages.current
    val t = Zen.tokens
    Row(
        modifier.semantics { liveRegion = LiveRegionMode.Polite },
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        ProvideText(color = t.mutedForeground.color(), style = TextStyles.xs) {
            val info = @Composable { Icon(Icons.InformationCircleMicro, size = 14.dp, color = t.primary.color()) }
            when {
                !c.foreign && from != null -> {
                    info()
                    Text(m.convertedFrom(formatMoney(from.amount, from.currency, c.locale), roundRate(from.rate)))
                }
                c.status == RatesStatus.Idle || c.status == RatesStatus.Loading -> {
                    Spinner(size = 12.dp)
                    Text(m.gettingRate)
                }
                c.rate == null -> {
                    Icon(Icons.ExclamationTriangleMicro, size = 14.dp, color = t.destructive.color())
                    Text(m.ratesUnavailable(c.home))
                }
                else -> {
                    info()
                    Text(rateLine(c, m, t.foreground.color()))
                }
            }
        }
    }
}

private fun rateLine(c: MoneyConversion, m: Messages, strong: androidx.compose.ui.graphics.Color): AnnotatedString = buildAnnotatedString {
    val rate = c.rate ?: return@buildAnnotatedString
    if (c.preview != null) {
        withStyle(SpanStyle(color = strong, fontWeight = TextStyles.medium.fontWeight)) { append("≈ ${formatMoney(c.preview, c.home, c.locale)} · ") }
    }
    var scale = 1.0
    repeat(currencyDigits(c.home)) { scale *= 10 }
    append(m.rateOf(c.currency, formatMoney(floor(rate * scale + 0.5).toLong(), c.home, c.locale)))
    append(" (")
    if (c.source != null) append("${c.source}, ")
    append(formatDate(c.date ?: return@buildAnnotatedString, c.locale, DateStyle.Day))
    append(")")
}

/** A rate as it's worth reading: 2 places from 100, 4 from 1, else 4 significant digits. */
private fun roundRate(r: Double): String {
    val places = when {
        r >= 100 -> 2
        r >= 1 -> 4
        else -> 3 - floor(log10(r)).toInt()
    }
    return formatNumber(r, "en", NumberOptions(minimumFractionDigits = places, maximumFractionDigits = places, useGrouping = false))
}

/** Typing amounts in other currencies, converted into the field's own. */
class CurrencyConversion(
    /** Currencies to offer besides the field's own, in order. Those the loaded rates lack are left out. */
    val currencies: List<String>,
    /**
     * Gets the rates, the first time another currency is picked: from a cache, or fetched; null
     * when unavailable (as is a throw). Cache as you see fit.
     */
    val loadRates: suspend () -> RateTable?,
    /** Named with the rate, e.g. "ECB". */
    val source: String? = null,
    /** The original after a conversion, or null when the amount was typed in the field's currency. */
    val onForeign: ((ForeignAmount?) -> Unit)? = null,
    /** Open showing a saved foreign amount (e.g. editing an entry that was converted). */
    val initial: ForeignAmount? = null,
)

enum class RatesStatus { Idle, Loading, Ready, Error }

/** A converting field's currency switch and conversion, for MoneyCurrencyMenu and MoneyConversionHint. */
class MoneyConversion internal constructor(
    /** The field's own currency. */
    val home: String,
    val locale: String,
    /** The currency being typed in. */
    val currency: String,
    /** Whether that's another currency, converted into `home`. */
    val foreign: Boolean,
    /** Other currencies to offer: `convert.currencies`, less those the loaded rates lack. */
    val choices: List<String>,
    val pick: (String) -> Unit,
    val status: RatesStatus,
    /** Units of `home` per 1 of `currency`, once loaded. */
    val rate: Double?,
    /** Day of the rates, once loaded. */
    val date: String?,
    val source: String?,
    /** What the typed amount comes to in `home`. */
    val preview: Money?,
    /** What the shown amount was converted from, after a conversion. */
    val converted: ForeignAmount?,
)

/**
 * MoneyInput's behaviour without its look: give an InputGroupInput (or any text field) `text`,
 * `onTextChange` and Modifier.moneyInput, and show `error`. With `convert`, `conversion` drives
 * MoneyCurrencyMenu and MoneyConversionHint.
 */
@Composable
fun rememberMoneyInput(
    value: Money?,
    onValueChange: (Money?) -> Unit,
    currency: String,
    locale: String? = null,
    allowNegative: Boolean = false,
    allowEmpty: Boolean = false,
    live: Boolean = false,
    onCancel: (() -> Unit)? = null,
    convert: CurrencyConversion? = null,
): MoneyInputState {
    val loc = locale(locale)
    val messages = LocalMessages.current
    val scope = rememberCoroutineScope()
    val state = remember {
        val initial = convert?.initial
        MoneyInputState(
            text = if (initial != null) formatAmount(initial.amount, initial.currency, loc) else value?.let { formatAmount(it, currency, loc) } ?: "",
            inputCurrency = initial?.currency ?: currency,
        )
    }
    state.options = MoneyInputState.Options(value, onValueChange, currency, loc, allowNegative, allowEmpty, live, onCancel, convert, messages)

    // Follow outside changes while nobody's editing (or typing in another currency).
    LaunchedEffect(value, currency, loc) {
        if (!state.focused && !state.foreign && !(live && state.dirty)) state.text = state.format(value)
    }
    // Rates load the first time they're needed (and again after a failure, when next needed); a
    // load carries on if they stop being needed meanwhile.
    LaunchedEffect(state.foreign) {
        val load = state.options.convert?.loadRates
        if (load == null || !state.foreign || state.status == RatesStatus.Ready || state.status == RatesStatus.Loading) return@LaunchedEffect
        state.status = RatesStatus.Loading
        scope.launch {
            val table = try {
                load()
            } catch (e: CancellationException) {
                throw e
            } catch (_: Exception) {
                null
            }
            state.table = table
            state.status = if (table != null) RatesStatus.Ready else RatesStatus.Error
        }
    }
    // Live: once the rate arrives, report the conversion of what's already typed.
    val rate = state.rate
    LaunchedEffect(rate) {
        if (live && state.dirty && state.foreign) state.report(state.text, state.inputCurrency, rate)
    }
    return state
}

/** Focus and keys for MoneyInput's text field: leaving it or Enter commits; Escape reverts. */
fun Modifier.moneyInput(money: MoneyInputState): Modifier = this
    .onFocusChanged {
        if (it.isFocused == money.focused) return@onFocusChanged
        money.focused = it.isFocused
        if (!it.isFocused) money.finish()
    }
    .onPreviewKeyEvent { e ->
        if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
        when (e.key) {
            Key.Enter, Key.NumPadEnter -> {
                money.finish()
                false
            }
            Key.Escape -> {
                money.revert()
                true
            }
            else -> false
        }
    }
    .semantics { money.error?.let { error(it) } }

@Stable
class MoneyInputState internal constructor(text: String, inputCurrency: String) {
    internal class Options(
        val value: Money?,
        val onValueChange: (Money?) -> Unit,
        val currency: String,
        val locale: String,
        val allowNegative: Boolean,
        val allowEmpty: Boolean,
        val live: Boolean,
        val onCancel: (() -> Unit)?,
        val convert: CurrencyConversion?,
        val m: Messages,
    )

    internal lateinit var options: Options

    /** What's in the field. */
    var text by mutableStateOf(text)

    /** Why what's typed isn't an amount, until it's fixed. */
    var error by mutableStateOf<String?>(null)
        private set

    // The currency being typed in: the field's own, or a foreign one converted into it.
    internal var inputCurrency by mutableStateOf(inputCurrency)
    // What the shown amount was last converted from.
    internal var converted by mutableStateOf<ForeignAmount?>(null)
    internal var focused by mutableStateOf(false)
    // Live mode reports while typing; an untouched field keeps showing the value it was given.
    internal var dirty by mutableStateOf(false)
    internal var table by mutableStateOf<RateTable?>(null)
    internal var status by mutableStateOf(RatesStatus.Idle)

    /** The amount in minor units, or null. */
    val value: Money? get() = options.value

    /** The symbol of the currency being typed in, in this locale, e.g. "₹" or "$". */
    val symbol: String get() = currencySymbol(inputCurrency, options.locale)

    /** The value formatted with its symbol, e.g. "₹1,52,000.00". */
    val formatted: String get() = options.value?.let { formatMoney(it, options.currency, options.locale) } ?: ""

    internal val foreign get() = options.convert != null && inputCurrency != options.currency
    internal val rate get() = if (foreign) rateFor(inputCurrency) else null

    /** With `convert`: the currency switch and conversion state; null without. */
    val conversion: MoneyConversion?
        get() {
            val convert = options.convert ?: return null
            val home = options.currency
            val table = table
            return MoneyConversion(
                home = home,
                locale = options.locale,
                currency = inputCurrency,
                foreign = foreign,
                choices = convert.currencies.filter { it != home && (table == null || it == table.base || it in table.rates) },
                pick = ::pick,
                status = status,
                rate = rate,
                date = table?.date,
                source = convert.source,
                preview = preview(),
                converted = converted,
            )
        }

    internal fun format(v: Money?) = v?.let { formatAmount(it, options.currency, options.locale) } ?: ""

    private fun rateFor(from: String): Double? {
        val table = table ?: return null
        return try {
            rateBetween(table, from, options.currency)
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    private fun example(cur: String) =
        options.m.notAnAmount(formatAmount(3274000, cur, options.locale), if (options.locale.endsWith("-IN")) "1.5L" else "10k")

    /** Checks the text in `cur`: the amount, null for empty, or no result (and shows why) if it isn't one. */
    private fun read(t: String, cur: String): Result<Money?> {
        val trimmed = t.trim()
        if (trimmed.isEmpty()) {
            if (options.allowEmpty) return Result.success(null)
            error = options.m.enterAmount
            return Result.failure(IllegalArgumentException())
        }
        val parsed = try {
            parseMoneyInput(trimmed, cur)
        } catch (e: IllegalArgumentException) {
            error = example(cur)
            return Result.failure(e)
        }
        if (!options.allowNegative && parsed < 0) {
            error = options.m.noNegative
            return Result.failure(IllegalArgumentException())
        }
        error = null
        return Result.success(parsed)
    }

    /** Live: report what the text means in `cur`, converted at `r`. */
    internal fun report(t: String, cur: String, r: Double?) {
        val o = options
        val trimmed = t.trim()
        if (trimmed.isEmpty()) {
            o.onValueChange(null)
            o.convert?.onForeign?.invoke(null)
            return
        }
        val parsed = try {
            parseMoneyInput(trimmed, cur)
        } catch (_: IllegalArgumentException) {
            // Not an amount (yet): report null; the form's own checks say so on save.
            o.onValueChange(null)
            return
        }
        when {
            cur == o.currency -> {
                o.onValueChange(parsed)
                o.convert?.onForeign?.invoke(null)
            }
            r == null -> o.onValueChange(null) // the rate isn't here yet: never report an unconverted amount
            else -> {
                o.onValueChange(convertMinor(parsed, r, cur, o.currency))
                o.convert?.onForeign?.invoke(ForeignAmount(cur, parsed, r, table!!.date))
            }
        }
    }

    /** Reports the amount (converted, if foreign) and tidies the text. Returns whether it was an amount. */
    fun commit(): Boolean {
        val o = options
        val parsed = read(text, inputCurrency).getOrElse { return false }
        if (parsed != null && foreign) {
            val rate = rate
            if (rate == null) {
                error = if (status == RatesStatus.Error) o.m.rateFailed else o.m.rateLoading
                return false
            }
            val home = convertMinor(parsed, rate, inputCurrency, o.currency)
            val original = ForeignAmount(inputCurrency, parsed, rate, table!!.date)
            converted = original
            inputCurrency = o.currency
            text = format(home)
            o.onValueChange(home)
            o.convert?.onForeign?.invoke(original)
            return true
        }
        text = format(parsed)
        o.onValueChange(parsed)
        // Confirming the same amount again (leaving the field after a conversion) keeps the
        // conversion; a different amount typed in the field's currency clears it.
        if (parsed != o.value) {
            converted = null
            o.convert?.onForeign?.invoke(null)
        }
        return true
    }

    /** Live, on leaving or Enter: values were already reported; just check and tidy the text. */
    private fun tidy() {
        read(text, inputCurrency).onSuccess { parsed ->
            text = if (parsed == null) "" else formatAmount(parsed, inputCurrency, options.locale)
        }
    }

    internal fun finish() {
        if (options.live) tidy() else commit()
    }

    internal fun revert() {
        inputCurrency = options.currency
        text = format(options.value)
        error = null
        options.onCancel?.invoke()
    }

    fun onTextChange(t: String) {
        text = t
        converted = null
        if (!options.live) return
        dirty = true
        report(t, inputCurrency, rate)
    }

    /** Switches the currency being typed in. */
    private fun pick(cur: String) {
        inputCurrency = cur
        error = null
        if (options.live && text.isNotBlank()) {
            dirty = true
            // A new currency needs its own rate; it's reported when it arrives.
            report(text, cur, if (cur == options.currency) null else rateFor(cur))
        }
    }

    private fun preview(): Money? {
        val rate = rate
        if (!foreign || rate == null || text.isBlank()) return null
        return try {
            convertMinor(parseMoneyInput(text, inputCurrency), rate, inputCurrency, options.currency)
        } catch (_: IllegalArgumentException) {
            null
        }
    }
}
