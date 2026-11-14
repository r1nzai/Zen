package dev.rinzai.zen

import kotlin.math.abs
import kotlin.math.floor

/** CLDR's plural categories, which Intl.PluralRules selects from. */
enum class PluralCategory { Zero, One, Two, Few, Many, Other }

/**
 * The plural category of a number in a locale, as Intl.PluralRules gives it. `digits` is the number
 * as shown, in plain digits ("1.50"): its visible decimals count, so 1 is "one" in English but 1.0
 * is "other".
 */
fun pluralCategory(digits: String, locale: String): PluralCategory {
    // By language, the tag cut short (sr-Latn → sr), as ICU looks rules up: not by CLDR's parents.
    // A language without rules takes Intl's default's.
    val rules = generateSequence(canonicalTag(locale)) { it.substringBeforeLast('-', "").ifEmpty { null } }
        .firstNotNullOfOrNull { pluralRules(it) } ?: pluralRules("en")!!
    val operands = Operands(digits)
    return rules.firstOrNull { (_, rule) -> rule.matches(operands) }?.first ?: PluralCategory.Other
}

/** A locale and its CLDR parents, nearest first (en-IN, en-001, en), ending before the root. */
internal fun cldrChain(locale: String): Sequence<String> =
    generateSequence(locale) { tag -> CldrParents[tag] ?: tag.substringBeforeLast('-', "").ifEmpty { null } }
        .takeWhile { it != "root" }

private val ParsedRules: Map<String, List<Pair<PluralCategory, Rule>>> by lazy {
    PluralRuleText.mapValues { (_, text) ->
        text.split(';').filter { it.isNotEmpty() }.map { entry ->
            val (count, rule) = entry.split(':', limit = 2)
            PluralCategory.entries.first { it.name.equals(count, ignoreCase = true) } to Rule.parse(rule)
        }
    }
}

private fun pluralRules(locale: String) = ParsedRules[locale]

/** UTS #35's operands: n, i, v, w, f, t (and e, always 0: Zen doesn't show compact exponents). */
private class Operands(digits: String) {
    val n: Double
    val i: Long
    val v: Int
    val w: Int
    val f: Long
    val t: Long

    init {
        val plain = digits.trimStart('-', '+')
        val whole = plain.substringBefore('.')
        val fraction = plain.substringAfter('.', "")
        val trimmed = fraction.trimEnd('0')
        n = abs(plain.toDouble())
        i = whole.ifEmpty { "0" }.toLong()
        v = fraction.length
        w = trimmed.length
        f = fraction.ifEmpty { "0" }.toLong()
        t = trimmed.ifEmpty { "0" }.toLong()
    }

    operator fun get(operand: Char): Double = when (operand) {
        'n' -> n
        'i' -> i.toDouble()
        'v' -> v.toDouble()
        'w' -> w.toDouble()
        'f' -> f.toDouble()
        't' -> t.toDouble()
        else -> 0.0 // e and c
    }
}

/** A rule's condition: relations joined by `and`, those joined by `or`. */
private class Rule(private val any: List<List<Relation>>) {
    fun matches(o: Operands) = any.any { all -> all.all { it.matches(o) } }

    companion object {
        fun parse(text: String) = Rule(
            text.split(" or ").map { and -> and.split(" and ").map { Relation.parse(it.trim()) } },
        )
    }
}

/** `operand (% mod)? (= | !=) ranges`: a range matches only whole values of the operand. */
private class Relation(
    private val operand: Char,
    private val mod: Long?,
    private val equal: Boolean,
    private val ranges: List<ClosedRange<Double>>,
) {
    fun matches(o: Operands): Boolean {
        val raw = o[operand]
        val x = if (mod != null) raw % mod else raw
        val inside = x == floor(x) && ranges.any { x in it }
        return inside == equal
    }

    companion object {
        private val Syntax = Regex("""([niVvwftec])\s*(?:%\s*(\d+))?\s*(!=|=)\s*(.+)""")

        fun parse(text: String): Relation {
            val m = Syntax.matchEntire(text) ?: error("Not a CLDR plural relation: $text")
            val (operand, mod, op, list) = m.destructured
            val ranges = list.split(',').map { item ->
                val bounds = item.trim().split("..")
                bounds.first().toDouble()..bounds.last().toDouble()
            }
            return Relation(operand.first(), mod.toLongOrNull(), op == "=", ranges)
        }
    }
}
