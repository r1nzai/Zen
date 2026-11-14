package dev.rinzai.zen

/**
 * The locale Intl formats `tag` as, of those it has data for (`supported`): the tag as Intl reads
 * it, cut short until it's one Intl has (en-TH is en), else und, which stands for Intl's default.
 */
internal fun intlLocale(tag: String, supported: Set<String>): String {
    var t = canonicalTag(tag) ?: return "und"
    while (true) {
        if (t in supported) return t
        t = t.substringBeforeLast('-', "").ifEmpty { return "und" }
    }
}

/**
 * `tag` as Intl reads it: cased as BCP 47 writes it, its language code as Intl replaces it (iw is
 * he), with the likely script where Intl takes it (zh-TW is zh-Hant-TW), without extensions.
 */
internal fun canonicalTag(tag: String): String? {
    // Extensions (-u-…) and private use (-x-…) start at the first single-letter subtag.
    val subtags = tag.replace('_', '-').split('-').takeWhile { it.length > 1 }
    if (subtags.isEmpty()) return null
    val language = subtags[0].lowercase().let { LanguageAliases[it] ?: it }
    val rest = subtags.drop(1).map {
        when {
            it.length == 4 && it[0].isLetter() -> it[0].uppercase() + it.substring(1).lowercase()
            it.length == 2 || it.length == 3 && it.all(Char::isDigit) -> it.uppercase()
            else -> it.lowercase()
        }
    }
    val t = (listOf(language) + rest).joinToString("-")
    return ScriptAliases[t] ?: t
}
