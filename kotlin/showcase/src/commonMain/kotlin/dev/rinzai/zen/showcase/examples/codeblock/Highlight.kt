package dev.rinzai.zen.showcase.examples.codeblock

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import dev.rinzai.zen.codeblock.SyntaxColors

private val KEYWORDS = setOf(
    "import", "from", "export", "default", "function", "return", "const", "let", "var", "if", "else", "for", "while",
    "do", "switch", "case", "break", "continue", "new", "class", "extends", "async", "await", "yield", "try", "catch",
    "finally", "throw", "typeof", "instanceof", "in", "of", "true", "false", "null", "undefined", "this", "type", "interface",
)

/**
 * A small JS/JSX highlighter after sugar-high's rules (keywords, strings, comments, capitalised
 * names as classes; JSX tags, attributes and text), coloured with a CodeBlock's syntaxColors().
 */
fun highlightJsx(code: String, colors: SyntaxColors): AnnotatedString = buildAnnotatedString {
    var i = 0
    var inTag = false
    var afterTagName = false
    var depth = 0
    fun put(text: String, color: Color) = withStyle(SpanStyle(color = color)) { append(text) }
    while (i < code.length) {
        val c = code[i]
        when {
            c.isWhitespace() -> { append(c); i++ }
            // JSX text between tags.
            depth > 0 && !inTag && c != '<' && c != '{' -> {
                val end = code.indexOfAny(charArrayOf('<', '{'), i).let { if (it < 0) code.length else it }
                val trimmed = code.substring(i, end).trimEnd()
                put(trimmed, colors.jsxLiterals)
                i += trimmed.length
            }
            code.startsWith("//", i) -> {
                val end = code.indexOf('\n', i).let { if (it < 0) code.length else it }
                put(code.substring(i, end), colors.comment); i = end
            }
            code.startsWith("/*", i) -> {
                val end = code.indexOf("*/", i + 2).let { if (it < 0) code.length else it + 2 }
                put(code.substring(i, end), colors.comment); i = end
            }
            c == '\'' || c == '"' || c == '`' -> {
                var j = i + 1
                while (j < code.length && code[j] != c) j += if (code[j] == '\\') 2 else 1
                put(c.toString(), colors.string)
                put(code.substring(i + 1, minOf(j, code.length)), colors.string)
                if (j < code.length) put(c.toString(), colors.string)
                i = j + 1
            }
            c == '<' && (code.getOrNull(i + 1)?.let { it.isLetter() || it == '/' } == true) -> {
                val closing = code[i + 1] == '/'
                put(if (closing) "</" else "<", colors.sign)
                i += if (closing) 2 else 1
                inTag = true
                afterTagName = true
                if (closing) depth-- else depth++
            }
            inTag && (c == '>' || code.startsWith("/>", i)) -> {
                val selfClosing = c == '/'
                put(if (selfClosing) "/>" else ">", colors.sign)
                if (selfClosing) depth--
                i += if (selfClosing) 2 else 1
                inTag = false
            }
            c.isLetter() || c == '_' || c == '$' -> {
                var j = i
                while (j < code.length && (code[j].isLetterOrDigit() || code[j] == '_' || code[j] == '$')) j++
                val word = code.substring(i, j)
                put(
                    word,
                    when {
                        inTag && afterTagName -> colors.entity.also { afterTagName = false }
                        inTag -> colors.property
                        word in KEYWORDS -> colors.keyword
                        word[0].isUpperCase() -> colors.`class`
                        else -> colors.identifier
                    },
                )
                i = j
            }
            c.isDigit() -> {
                var j = i
                while (j < code.length && (code[j].isLetterOrDigit() || code[j] == '.')) j++
                put(code.substring(i, j), colors.`class`); i = j
            }
            else -> { put(c.toString(), colors.sign); i++ }
        }
    }
}
