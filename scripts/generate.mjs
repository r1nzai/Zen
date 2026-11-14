// Writes both libraries' generated sources from tokens/, the one place the design is defined:
// - tokens/zen*.tokens.json → web/packages/variables.css and Kotlin's Tokens.kt
// - tokens/icons.json (+ Heroicons) → web/packages/icons/*.tsx and Kotlin's Icons.kt
// - tokens/assets → where each library's examples use them
// - CLDR (cldr-core, cldr-units-full, cldr-misc-full, pinned to the CLDR browsers' Intl uses) → Kotlin's plural rules
//   parent locales and list patterns (CldrData.kt), the unit patterns desktop and iOS format with (UnitPatterns.kt),
//   and the number formats desktop formats with, where the JDK's CLDR lags Chrome's (NumberData.kt)
// Run: pnpm generate. With --check (CI: pnpm generate:check) it writes nothing and fails if any is out of date.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const read = (file) => readFileSync(join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const NOTE = "Generated from tokens/ by scripts/generate.mjs; don't edit.";

// ── Tokens ──

const ZEN = 'dev.rinzai.zen';
const dark = json('tokens/zen.tokens.json');
const light = json('tokens/zen-light.tokens.json');

/** Groups in order, each with its tokens: { name, type, value, description, zen } (types inherited from the group). */
function groups(file) {
    return Object.entries(file)
        .filter(([key]) => !key.startsWith('$'))
        .map(([group, body]) => ({
            group,
            description: body.$description,
            tokens: Object.entries(body)
                .filter(([key]) => !key.startsWith('$'))
                .map(([name, token]) => ({
                    name,
                    type: token.$type ?? body.$type,
                    value: token.$value,
                    description: token.$description,
                    zen: token.$extensions?.[ZEN] ?? {},
                })),
        }));
}
const base = groups(dark);
const overrides = new Map(groups(light).flatMap((g) => g.tokens.map((t) => [t.name, t])));
const themed = (t) => overrides.get(t.name) ?? t;

const trim = (n) => String(Number(n.toFixed(4)));
// A length of 0 needs no unit; a time always does.
const dim = ({ value, unit }) => (value === 0 && unit !== 'ms' && unit !== 's' ? '0' : `${trim(value)}${unit}`);
// OKLCH at full opacity is a token's "L C H" triplet, used as oklch(var(--x) / alpha); other colours are whole.
const isTriplet = (v) => v.colorSpace === 'oklch' && (v.alpha ?? 1) === 1;

function cssColor(v) {
    const [a, b, c] = v.components;
    const alpha = (v.alpha ?? 1) === 1 ? '' : ` / ${trim(v.alpha)}`;
    if (v.colorSpace === 'oklch') return `oklch(${trim(a)} ${trim(b)} ${trim(c)}${alpha})`;
    if (v.colorSpace === 'hsl') return `hsl(${trim(a)} ${trim(b)}% ${trim(c)}%${alpha})`;
    if (v.colorSpace === 'srgb') return v.hex;
    throw new Error(`generate: no CSS for colour space ${v.colorSpace}`);
}

function cssValue(t) {
    const v = t.value;
    if (t.name === 'glow-k') return `calc(var(--glow-strength) / ${trim(t.zen.tunedAt)})`;
    if (t.type === 'color') {
        if (t.zen.of) return `oklch(var(--${t.zen.of.match(/\.([\w-]+)\}$/)[1]}) / ${trim(v.alpha)})`;
        return isTriplet(v) ? v.components.map(trim).join(' ') : cssColor(v);
    }
    if (t.type === 'dimension' || t.type === 'duration') return dim(v);
    if (t.type === 'number') return trim(v);
    if (t.type === 'shadow') return `${dim(v.offsetX)} ${dim(v.offsetY)} ${dim(v.blur)} ${dim(v.spread)} ${cssColor(v.color)}`;
    throw new Error(`generate: no CSS for ${t.name} (${t.type})`);
}

const INDENT = '    ';
/** A comment above a line (or a group), wrapped at 100 columns. */
function above(text) {
    const lines = [''];
    for (const w of text.split(' ')) {
        if (`${lines.at(-1)} ${w}`.length > 100 - INDENT.length - 3) lines.push(w);
        else lines[lines.length - 1] = lines.at(-1) ? `${lines.at(-1)} ${w}` : w;
    }
    return lines.length === 1
        ? `${INDENT}/* ${lines[0]} */\n`
        : `${INDENT}/*\n${lines.map((l) => `${INDENT} * ${l}`).join('\n')}\n${INDENT} */\n`;
}

function cssBlock(selector, scheme, pick) {
    const body = base
        .map(({ description, tokens }) => {
            const lines = tokens
                .map((t) => pick(t))
                .filter(Boolean)
                .map((t) => {
                    const decl = `${INDENT}--${t.name}: ${cssValue(t)};`;
                    if (!t.description) return decl;
                    // Short notes go on the line, as a word or two would.
                    return t.description.length <= 48 ? `${decl} /* ${t.description} */` : above(t.description) + decl;
                });
            if (!lines.length) return null;
            return (description && pick === same ? above(description) : '') + lines.join('\n');
        })
        .filter(Boolean)
        .join('\n\n');
    return `${selector} {\n${INDENT}color-scheme: ${scheme};\n\n${body}\n}\n`;
}
const same = (t) => t;
// A light token is written when it differs from the dark one (its description only if it has its own).
const lightOnly = (t) => {
    const o = overrides.get(t.name);
    return o && { ...o, type: o.type ?? t.type, zen: o.zen };
};

const variablesCss = `/*
 * ${NOTE}
 *
 * Colour tokens are OKLCH "L C H" triplets, used as oklch(var(--x)) or
 * oklch(var(--x) / alpha). Lightness is fixed per role, so contrast holds
 * whatever hue a theme picks; only hue and chroma carry the brand.
 *
 * Dark glass is the default. Add \`light\` (or data-theme="light") to an
 * element for the light palette, and \`dark\` to switch back inside it.
 */
${cssBlock(":root,\n:is(.dark, [data-theme='dark'])", 'dark', same)}
${cssBlock(":is(.light, [data-theme='light'])", 'light', lightOnly)}`;

// Kotlin: one field per token. Triplets are Oklch (taken with an alpha where used), whole colours Color,
// lengths in px, durations in ms. glow-k is worked out from glow-strength, as in CSS.
const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const kf = (n) => `${trim(n)}f`;
const ktType = (t) =>
    t.type === 'color' ? (isTriplet(t.value) ? 'Oklch' : 'Color') : t.type === 'shadow' ? 'Shadow' : 'Float';
const px = ({ value, unit }) => kf(unit === 'rem' ? value * 16 : value);

function ktColor(v) {
    const [a, b, c] = v.components;
    const alpha = kf(v.alpha ?? 1);
    if (v.colorSpace === 'oklch') return `Oklch(${kf(a)}, ${kf(b)}, ${kf(c)}).color(${alpha})`;
    if (v.colorSpace === 'hsl') return `Color.hsl(${kf(a)}, ${kf(b / 100)}, ${kf(c / 100)}, ${alpha})`;
    return `Color(0xFF${v.hex.slice(1).toUpperCase()})`;
}

function ktValue(t) {
    const v = t.value;
    if (t.name === 'glow-k') return kf(t.zen.tunedAt);
    if (t.type === 'color') return isTriplet(v) ? `Oklch(${v.components.map(kf).join(', ')})` : ktColor(v);
    if (t.type === 'dimension') return px(v);
    if (t.type === 'duration') return kf(v.unit === 's' ? v.value * 1000 : v.value);
    if (t.type === 'number') return kf(v);
    if (t.type === 'shadow')
        return `Shadow(x = ${px(v.offsetX)}, y = ${px(v.offsetY)}, blur = ${px(v.blur)}, spread = ${px(v.spread)}, color = ${ktColor(v.color)})`;
}

const all = base.flatMap((g) => g.tokens);
const field = (t) => (t.name === 'glow-k' ? 'glowTunedAt' : camel(t.name));
const kdoc = (t) => {
    const unit = t.type === 'dimension' ? ' (px)' : t.type === 'duration' ? ' (ms)' : '';
    const what = t.name === 'glow-k' ? 'The glow strength the component halos were tuned at: --glow-k is glow-strength over this.' : t.description;
    return `    /** --${t.name}${unit}${what ? `: ${what}` : ''} */`;
};
const palette = (pick) =>
    all.map((t) => `            ${field(t)} = ${ktValue({ ...t, ...pick(t), type: t.type })},`).join('\n');

const tokensKt = `// ${NOTE}
package dev.rinzai.zen

import androidx.compose.ui.graphics.Color

/** Zen's design tokens (tokens/zen.tokens.json): one field per token, as web/packages/variables.css has one custom property. */
data class Tokens(
${all.map((t) => `${kdoc(t)}\n    val ${field(t)}: ${ktType(t)},`).join('\n')}
) {
    /** --glow-k: halos tuned at the default strength scale with glow-strength, so 0 turns them off too. */
    val glowK: Float get() = glowStrength / glowTunedAt

    companion object {
        val Dark = Tokens(
${palette(same)}
        )
        val Light = Tokens(
${palette(themed)}
        )
    }
}
`;

// ── Icons ──

const iconSet = json('tokens/icons.json');
const require = createRequire(join(root, 'package.json'));
const heroicons = dirname(require.resolve('heroicons/package.json'));
const { version } = JSON.parse(readFileSync(join(heroicons, 'package.json'), 'utf8'));
if (version !== iconSet.heroicons) throw new Error(`generate: tokens/icons.json wants Heroicons ${iconSet.heroicons}, ${version} is installed`);
const svgOf = (source) => readFileSync(join(heroicons, `${source}.svg`), 'utf8').trim();
const attrsOf = (tag) => [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]);
const JSX = { 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule' };
const jsxAttr = ([k, v]) => `${JSX[k] ?? k}="${v}"`;

/** A Heroicon as packages/icons writes it, laid out as the formatter would (printWidth 120). */
function iconTsx(file, { name, source }) {
    const svg = svgOf(source);
    const svgAttrs = attrsOf(svg.match(/^<svg ([^>]*)>/)[1]);
    const size = source.startsWith('16/') ? 'size-4' : 'size-6';
    const paths = [...svg.matchAll(/<path ([^>]*?)\/?>/g)].map(([, a]) => {
        const attrs = attrsOf(a).map(jsxAttr);
        const one = `            <path ${attrs.join(' ')} />`;
        return one.length <= 120 || attrs.length === 1 ? one : `            <path\n${attrs.map((x) => `                ${x}`).join('\n')}\n            />`;
    });
    const depth = file.includes('/') ? '../' : './';
    return `// Heroicons ${version}, ${source}.svg (MIT, Tailwind Labs: https://heroicons.com).
// ${NOTE}
import IconProps from '${depth}icon.types';

export default function ${name}(props: IconProps) {
    return (
        <svg
            className="${size}"
${svgAttrs.map((x) => `            ${jsxAttr(x)}`).join('\n')}
            {...props}
        >
${paths.join('\n')}
        </svg>
    );
}
`;
}

const iconsKt = `// ${NOTE}
package dev.rinzai.zen.icons

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/** The icons Zen draws (tokens/icons.json): Heroicons ${version} (MIT, Tailwind Labs: https://heroicons.com), tinted where drawn. */
object Icons {
${Object.entries(iconSet.icons)
    .map(([file, { name, source }]) => {
        const svg = svgOf(source);
        const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
        const stroked = /<svg[^>]* stroke="currentColor"/.test(svg);
        const width = svg.match(/stroke-width="([^"]+)"/)?.[1] ?? '1.5';
        const paths = [...svg.matchAll(/<path ([^>]*?)\/?>/g)].map(([, a]) => {
            const d = a.match(/ d="([^"]+)"/)?.[1] ?? a.match(/^d="([^"]+)"/)[1];
            const evenOdd = /fill-rule="evenodd"/.test(a);
            return stroked
                ? `            addPath(addPathNodes("${d}"), stroke = SolidColor(Color.Black), strokeLineWidth = ${kf(Number(width))}, strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round)`
                : `            addPath(addPathNodes("${d}"), fill = SolidColor(Color.Black)${evenOdd ? ', pathFillType = PathFillType.EvenOdd' : ''})`;
        });
        const prop = name.replace(/Icon$/, '');
        return `    /** ${source}: web/packages/icons/${file}.tsx */
    val ${prop}: ImageVector by lazy {
        ImageVector.Builder("${prop}", ${w}.dp, ${h}.dp, ${kf(w)}, ${kf(h)}).apply {
${paths.join('\n')}
        }.build()
    }`;
    })
    .join('\n')}
}
`;

// ── CLDR ──

const requireCldr = createRequire(join(root, 'package.json'));
const availableLocales = requireCldr('cldr-core/availableLocales.json').availableLocales.full;
const cldrParents = requireCldr('cldr-core/supplemental/parentLocales.json').supplemental.parentLocales.parentLocale;
const pluralRules = requireCldr('cldr-core/supplemental/plurals.json').supplemental['plurals-type-cardinal'];
// Which locales Intl has data for is read from Node's, held to the CLDR pinned here.
const [cldrMajor, cldrMinor] = requireCldr('cldr-core/package.json').version.split('.');
if (process.versions.cldr.split('.').slice(0, 2).join('.') !== `${cldrMajor}.${cldrMinor}`)
    throw new Error(`generate: Intl's locales need Node's CLDR ${cldrMajor}.${cldrMinor} (as cldr-core), not ${process.versions.cldr}`);
const numberLocales = availableLocales.filter((locale) => new Intl.NumberFormat(locale).resolvedOptions().locale === locale);
const dateLocaleSet = availableLocales.filter((locale) => new Intl.DateTimeFormat(locale).resolvedOptions().locale === locale);
// Language codes Intl replaces (iw is he), and tags it formats as one with the likely script
// (zh-TW as zh-Hant-TW); intlLocale in Locales.kt takes these, then cuts the tag short to a locale
// Intl has, or else und, its default.
const languageAliases = Object.entries(requireCldr('cldr-core/supplemental/aliases.json').supplemental.metadata.alias.languageAlias)
    .map(([from, { _replacement: to }]) => [from, to])
    .filter(([from, to]) => /^[a-z]{2,3}$/.test(from) && /^[a-z]{2,3}$/.test(to) && Intl.getCanonicalLocales(from)[0] === to)
    .sort(([a], [b]) => (a < b ? -1 : 1));
const scriptAliases = availableLocales
    .map((locale) => [locale, /^([a-z]{2,3})-[A-Z][a-z]{3}-([A-Z]{2}|\d{3})$/.exec(locale)])
    .filter(([, m]) => m && !availableLocales.includes(`${m[1]}-${m[2]}`))
    .map(([locale, m]) => [`${m[1]}-${m[2]}`, locale])
    .filter(([short, locale]) => new Intl.Locale(short).maximize().toString() === locale && new Intl.DateTimeFormat(short).resolvedOptions().locale === short)
    .sort(([a], [b]) => (a < b ? -1 : 1));
/** As intlLocale: the locale Intl formats `tag` as, of `supported`. */
function intlLocale(tag, supported) {
    const [language, ...rest] = tag.split('-');
    let t = [Object.fromEntries(languageAliases)[language] ?? language, ...rest].join('-');
    t = Object.fromEntries(scriptAliases)[t] ?? t;
    for (; t; t = t.includes('-') ? t.slice(0, t.lastIndexOf('-')) : '') if (supported.includes(t)) return t;
    return 'und';
}
// Checked against Intl for every locale CLDR has, and tags it only has as aliases.
for (const [supported, service] of [[numberLocales, Intl.NumberFormat], [dateLocaleSet, Intl.DateTimeFormat]])
    for (const tag of [...availableLocales, ...scriptAliases.map(([short]) => short), 'en-TH', 'pa-PK', 'iw', 'in-ID', 'zh-TW', 'xx-YY']) {
        // Intl's own locales include some CLDR leaves empty (ca-ES is ca's), so the two are compared
        // cut short to a locale CLDR has; und stands for Intl's default.
        const intl = new service(tag).resolvedOptions().locale;
        const isDefault = intl === new service().resolvedOptions().locale && intl.split('-')[0] !== tag.split('-')[0];
        const expected = isDefault ? 'und' : intlLocale(Object.fromEntries(scriptAliases)[intl] ?? intl, supported);
        const ours = intlLocale(tag, supported);
        if (ours !== expected) throw new Error(`generate: Intl.${service.name} formats ${tag} as ${intl}, intlLocale gives ${ours}`);
    }
const parentOf = (locale) => cldrParents[locale] ?? (locale.includes('-') ? locale.slice(0, locale.lastIndexOf('-')) : 'root');
const kstr = (text) =>
    '"' +
    [...text]
        .map((c) =>
            c === '"' || c === '\\' || c === '$'
                ? '\\' + c
                : c.charCodeAt(0) < 32 || c.charCodeAt(0) === 0x7f
                  ? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0').toUpperCase()}`
                  : c,
        )
        .join('') +
    '"';

// Plural rules without their samples: "one:i = 1 and v = 0;…"; `other` is what's left.
const rules = Object.entries(pluralRules)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([locale, body]) => {
        const text = Object.entries(body)
            .map(([key, rule]) => [key.replace('pluralRule-count-', ''), rule.split('@')[0].trim()])
            .filter(([count, rule]) => count !== 'other' && rule)
            .map(([count, rule]) => `${count}:${rule}`)
            .join(';');
        return `        ${kstr(locale)} to ${kstr(text)},`;
    });
// Only where CLDR's parent isn't the tag cut short (es-MX → es-419, en-IN → en-001).
const parents = Object.entries(cldrParents)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([locale, parent]) => `        ${kstr(locale)} to ${kstr(parent)},`);
// Lists ("Mon, Thu"), short and of units as describeRepeat writes them: "start middle end two"
// patterns where a locale's differ from its parent's (und has them all), checked against Intl.ListFormat.
const listLocales = availableLocales.filter((locale) => new Intl.ListFormat(locale).resolvedOptions().locale === locale);
const listOf = (locale) => {
    const p = requireCldr(`cldr-misc-full/main/${locale}/listPatterns.json`).main[locale].listPatterns['listPattern-type-unit-short'];
    return [p.start, p.middle, p.end, p['2']].join('\u001F');
};
const listParent = (locale) => (locale === 'und' ? null : parentOf(locale) === 'root' ? 'und' : parentOf(locale));
const listInherited = (locale) => {
    for (let l = locale; l; l = listParent(l)) if (l === 'und' || listLocales.includes(l)) return listOf(l);
};
const listRecords = ['und', ...listLocales]
    .sort()
    .filter((locale) => locale === 'und' || listOf(locale) !== listInherited(listParent(locale)))
    .map((locale) => [locale, listOf(locale)]);
const formatListLike = (items, locale) => {
    const [start, middle, end, two] = listInherited(intlLocale(locale, listLocales)).split('\u001F');
    const fill = (p, a, b) => p.replace('{0}', a).replace('{1}', b);
    if (items.length < 2) return items[0] ?? '';
    if (items.length === 2) return fill(two, items[0], items[1]);
    let out = fill(end, items.at(-2), items.at(-1));
    for (let i = items.length - 3; i > 0; i--) out = fill(middle, items[i], out);
    return fill(start, items[0], out);
};
for (const locale of [...listLocales, 'en-IN', 'fr-CA', 'xx-YY'])
    for (const items of [['A'], ['A', 'B'], ['A', 'B', 'C'], ['A', 'B', 'C', 'D', 'E']]) {
        const intl = new Intl.ListFormat(locale, { style: 'short', type: 'unit' }).format(items);
        if (formatListLike(items, locale) !== intl) throw new Error(`generate: Intl.ListFormat gives ${locale} ${intl}, CLDR's patterns ${formatListLike(items, locale)}`);
    }

const cldrDataKt = `// ${NOTE}
package dev.rinzai.zen

/** CLDR's cardinal plural rules by locale, as "one:i = 1 and v = 0;few:…" (anything else is \`other\`). */
internal val PluralRuleText: Map<String, String> by lazy {
    mapOf(
${rules.join('\n')}
    )
}

/** Where CLDR's parent of a locale isn't the tag cut short. */
internal val CldrParents: Map<String, String> by lazy {
    mapOf(
${parents.join('\n')}
    )
}

/** The locales Intl.NumberFormat has data for (not CLDR's every one). */
internal val IntlNumberLocales: Set<String> by lazy { ${kstr(numberLocales.join(' '))}.split(' ').toSet() }

/** The locales Intl.ListFormat has data for. */
internal val IntlListLocales: Set<String> by lazy { ${kstr(listLocales.join(' '))}.split(' ').toSet() }

/** Short lists of units ("Mon, Thu"), as "start\\u001Fmiddle\\u001Fend\\u001Ftwo" patterns, where a locale's differ from its parent's. */
internal val ListPatterns: Map<String, String> by lazy {
    mapOf(
${listRecords.map(([l, v]) => `        ${kstr(l)} to ${kstr(v)},`).join('\n')}
    )
}

/** Language codes Intl replaces with another ("iw he …"). */
internal val LanguageAliases: Map<String, String> by lazy {
    ${kstr(languageAliases.flat().join(' '))}.split(' ').chunked(2).associate { (from, to) -> from to to }
}

/** Tags Intl formats as a locale with their likely script, where that isn't their language's. */
internal val ScriptAliases: Map<String, String> = mapOf(
${scriptAliases.map(([from, to]) => `    ${kstr(from)} to ${kstr(to)},`).join('\n')}
)
`;

// ECMA-402's sanctioned simple units, the ones Intl.NumberFormat takes.
const UNITS = 'acre bit byte celsius centimeter day degree fahrenheit fluid-ounce foot gallon gigabit gigabyte gram hectare hour inch kilobit kilobyte kilogram kilometer liter megabit megabyte meter microsecond mile mile-scandinavian milliliter millimeter millisecond minute month nanosecond ounce percent petabyte pound second stone terabit terabyte week yard year'.split(' ');
const DISPLAYS = { long: 'l', short: 's', narrow: 'n' };
const unitsOf = (locale) => requireCldr(`cldr-units-full/main/${locale}/units.json`).main[locale].units;
/** "other pattern" then "\u001Fcount=pattern" for each count whose pattern differs from other's. */
function unitEntries(locale) {
    const units = unitsOf(locale);
    const out = {};
    for (const [display, d] of Object.entries(DISPLAYS)) {
        const byKey = Object.fromEntries(Object.entries(units[display]).map(([key, v]) => [key.slice(key.indexOf('-') + 1), v]));
        for (const unit of UNITS) {
            const v = byKey[unit];
            if (!v) throw new Error(`CLDR has no ${display} ${unit} for ${locale}`);
            const other = v['unitPattern-count-other'];
            const counts = Object.entries(v)
                .filter(([key, p]) => key.startsWith('unitPattern-count-') && key !== 'unitPattern-count-other' && p !== other)
                .map(([key, p]) => `\u001F${key.slice('unitPattern-count-'.length)}=${p}`);
            out[`${unit}/${d}`] = other + counts.join('');
        }
    }
    return out;
}
const unitLocales = ['und', ...numberLocales];
const unitTable = Object.fromEntries(unitLocales.map((locale) => [locale, unitEntries(locale)]));
// Every chain ends at the root locale, und, whose patterns are the fallback.
const unitParent = (locale) => (locale === 'und' ? null : parentOf(locale) === 'root' ? 'und' : parentOf(locale));
const inherited = (locale, key) => {
    for (let l = locale; l; l = unitParent(l)) if (unitTable[l]) return unitTable[l][key];
    return undefined;
};
// Each locale's records, where they differ from its parent's: "locale\u001D" then "unit/display\u001Fpatterns\u001E" each.
const unitRecords = [];
for (const locale of unitLocales.sort()) {
    const own = Object.entries(unitTable[locale])
        .filter(([key, value]) => locale === 'und' || inherited(unitParent(locale), key) !== value)
        .map(([key, value]) => `${key}\u001F${value}\u001E`);
    if (own.length) unitRecords.push(`${locale}\u001D`, ...own);
}
// String constants are capped at 64 KB in a class file: the table goes in chunks under that.
const unitChunks = [];
let chunk = '';
for (const record of unitRecords) {
    if (Buffer.byteLength(chunk + record) > 30000) {
        unitChunks.push(chunk);
        chunk = '';
    }
    chunk += record;
}
unitChunks.push(chunk);
const unitPatternsKt = `// ${NOTE}
package dev.rinzai.zen

/**
 * CLDR's unit patterns ("{0} km") by locale, unit and display (l, s, n), where they differ from the
 * parent locale's (und, the root, has them all): "locale\\u001D", then "unit/display\\u001Fother
 * \\u001Fcount=pattern…\\u001E" for each. The chunks join into one string before it's read.
 */
internal val UnitPatternChunks: Array<String> = arrayOf(
${unitChunks.map((c) => `    ${kstr(c)},`).join('\n')}
)
`;

// Numbers, for desktop: each locale's default numbering system, its symbols and patterns, and
// its currency symbols, where they differ from the parent's; numbering systems' digits; currency digits.
const numbersOf = (locale) => requireCldr(`cldr-numbers-full/main/${locale}/numbers.json`).main[locale].numbers;
const currenciesOf = (locale) => requireCldr(`cldr-numbers-full/main/${locale}/currencies.json`).main[locale].numbers.currencies;
function numberEntries(locale) {
    const n = numbersOf(locale);
    const ns = n.defaultNumberingSystem;
    const sym = n[`symbols-numberSystem-${ns}`];
    const currency = n[`currencyFormats-numberSystem-${ns}`];
    const out = {
        ns,
        decimal: sym.decimal,
        group: sym.group,
        percent: sym.percentSign,
        plus: sym.plusSign,
        minus: sym.minusSign,
        decimalPattern: n[`decimalFormats-numberSystem-${ns}`].standard,
        percentPattern: n[`percentFormats-numberSystem-${ns}`].standard,
        currencyPattern: currency.standard,
        currencyAlphaPattern: currency['standard-alphaNextToNumber'] ?? currency.standard,
        minimumGrouping: String(n.minimumGroupingDigits),
    };
    for (const [code, c] of Object.entries(currenciesOf(locale))) if (c.symbol) out[`¤${code}`] = c.symbol;
    return out;
}
const numberTable = Object.fromEntries(unitLocales.map((locale) => [locale, numberEntries(locale)]));
const numberInherited = (locale, key) => {
    for (let l = locale; l; l = unitParent(l)) if (numberTable[l]?.[key] !== undefined) return numberTable[l][key];
    return undefined;
};
const numberRecords = [];
for (const locale of unitLocales) {
    const own = Object.entries(numberTable[locale])
        .filter(([key, value]) => locale === 'und' || numberInherited(unitParent(locale), key) !== value)
        .map(([key, value]) => `${key}\u001F${value}\u001E`);
    if (own.length) numberRecords.push(`${locale}\u001D`, ...own);
}
const chunked = (records) => {
    const chunks = [];
    let chunk = '';
    for (const record of records) {
        if (Buffer.byteLength(chunk + record) > 30000) {
            chunks.push(chunk);
            chunk = '';
        }
        chunk += record;
    }
    return [...chunks, chunk];
};
const numberingSystems = requireCldr('cldr-core/supplemental/numberingSystems.json').supplemental.numberingSystems;
const usedSystems = [...new Set(Object.values(numberTable).map((e) => e.ns))].sort();
const fractions = requireCldr('cldr-core/supplemental/currencyData.json').supplemental.currencyData.fractions;
const numberDataKt = `// ${NOTE}
package dev.rinzai.zen

/**
 * CLDR's number formats by locale, where they differ from the parent locale's (und, the root, has
 * them all): "locale\\u001D", then "key\\u001Fvalue\\u001E" for each. Keys: ns (the numbering
 * system), decimal, group, percent, plus, minus (symbols), decimalPattern, percentPattern,
 * currencyPattern, currencyAlphaPattern (for a symbol with a letter next to the number),
 * minimumGrouping, and ¤ and a currency code for its symbol. The chunks join into one string.
 */
internal val NumberDataChunks: Array<String> = arrayOf(
${chunked(numberRecords).map((c) => `    ${kstr(c)},`).join('\n')}
)

/** The digits, zero to nine, of each numbering system a locale defaults to. */
internal val NumberingDigits: Map<String, String> = mapOf(
${usedSystems.map((ns) => `    ${kstr(ns)} to ${kstr(numberingSystems[ns]._digits)},`).join('\n')}
)

/** A currency's decimal places, where it isn't 2. */
internal val CurrencyFractionDigits: Map<String, Int> = mapOf(
${Object.entries(fractions)
    .filter(([code, f]) => code !== 'DEFAULT' && f._digits !== '2')
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([code, f]) => `    ${kstr(code)} to ${f._digits},`)
    .join('\n')}
)
`;

// Compact numbers ("1.2K", "₹4.2L"), for every platform (Android 28's ICU has no compact currency):
// CLDR's short decimal and currency patterns for each numbering system a locale has them in, and its
// default numbering system, where they differ from the parent's. A pattern is the magnitude's power
// of ten, its plural count (with "+" for the alphaNextToNumber alternative) and the pattern.
const PLURALS = ['zero', 'one', 'two', 'few', 'many', 'other'];
function compactEntries(locale) {
    const n = numbersOf(locale);
    const out = { ns: n.defaultNumberingSystem };
    // Only other's pattern, and the counts (or the alternative) whose pattern differs from it.
    const encode = (formats) =>
        Object.entries(formats)
            .filter(([key, pattern]) => {
                const m = key.match(/^1(0*)-count-([a-z]+)(-alt-alphaNextToNumber)?$/);
                if (!m || !PLURALS.includes(m[2])) throw new Error(`generate: ${locale} has a compact pattern ${key}`);
                // An alternative falls back to other's alternative, and that to other's pattern.
                const base = formats[`1${m[1]}-count-other`];
                const other = m[3] && m[2] !== 'other' ? (formats[`1${m[1]}-count-other${m[3]}`] ?? base) : base;
                return !(m[2] === 'other' && !m[3]) ? pattern !== other : true;
            })
            .map(([key, pattern]) => {
                const m = key.match(/^1(0*)-count-([a-z]+)(-alt-alphaNextToNumber)?$/);
                return `${m[1].length}\u001F${m[2]}${m[3] ? '+' : ''}\u001F${pattern}`;
            })
            .join('\u001D');
    for (const key of Object.keys(n)) {
        const ns = key.match(/^decimalFormats-numberSystem-(\w+)$/)?.[1];
        if (!ns) continue;
        const d = n[key].short?.decimalFormat;
        const c = n[`currencyFormats-numberSystem-${ns}`]?.short?.standard;
        if (d) out[`${ns}:d`] = encode(d);
        if (c) out[`${ns}:c`] = encode(c);
    }
    return out;
}
const compactTable = Object.fromEntries(unitLocales.map((locale) => [locale, compactEntries(locale)]));
const compactInherited = (locale, key) => {
    for (let l = locale; l; l = unitParent(l)) if (compactTable[l]?.[key] !== undefined) return compactTable[l][key];
    return undefined;
};
const compactRecords = [];
for (const locale of unitLocales)
    for (const [key, value] of Object.entries(compactTable[locale]))
        if (locale === 'und' || compactInherited(unitParent(locale), key) !== value) compactRecords.push([`${locale}\u001F${key}`, value]);
const compactDataKt = `// ${NOTE}
package dev.rinzai.zen

/**
 * CLDR's compact number patterns, keyed "locale\\u001Fkey" where a locale's differ from its parent's
 * (und has them all). Keys: ns (the default numbering system), and "system:d" (decimal) and
 * "system:c" (currency) for each system the locale has them in: patterns joined by \\u001D, each
 * "zeros\\u001Fcount\\u001Fpattern", for 10^zeros, the plural count ("+" after it for the pattern
 * a symbol with a letter next to the number takes) and the pattern; a count missing takes other's.
 */
internal val CompactPatterns: Map<String, String> by lazy {
    mapOf(
${compactRecords.map(([k, v]) => `        ${kstr(k)} to ${kstr(v)},`).join('\n')}
    )
}
`;

// Dates, for desktop: what ICU's skeleton matching and interval formats resolve each pattern Zen
// uses to, read back from Intl itself (Node's ICU, held to the CLDR pinned above). Fields become
// tokens: \u0001code\u0001 for a date, or a range's start, \u0002code\u0002 for a range's end.
const DAY = 86400000;
const DATE_PATTERNS = {
    short: { dateStyle: 'short' },
    medium: { dateStyle: 'medium' },
    long: { dateStyle: 'long' },
    full: { dateStyle: 'full' },
    day: { day: 'numeric', month: 'short' },
    yMMM: { month: 'short', year: 'numeric' },
    yMMMM: { month: 'long', year: 'numeric' },
    MMM: { month: 'short' },
    E: { weekday: 'short' },
    EEEE: { weekday: 'long' },
    EEEEE: { weekday: 'narrow' },
    time: { hour: 'numeric', minute: '2-digit' },
};
const RANGES = ['short', 'medium', 'long', 'day'];
const dtf = (locale, options) => new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
/** A day's year, month and day in a calendar, and the days that make good samples in it. */
function calendarOf(calendar) {
    const f = dtf(`en-u-ca-${calendar}-nu-latn`, { year: 'numeric', month: 'numeric', day: 'numeric' });
    const at = (day) => {
        const p = Object.fromEntries(f.formatToParts(day * DAY).map((x) => [x.type, x.value]));
        return { y: Number(p.relatedYear ?? p.year), m: Number(p.month), d: Number(p.day) };
    };
    const find = (from, ok) => {
        for (let day = from; ; day++) if (ok(at(day))) return day;
    };
    // Single-digit days and months, so a 2-digit field shows itself; a range's two dates differ in
    // each, so which of them a field is from shows too.
    const base = find(20454, (c) => c.d <= 4 && c.m <= 8); // from 2026-01-01
    const b = at(base);
    return {
        at,
        base,
        diffs: {
            d: base + 4,
            M: find(base + 1, (c) => c.y === b.y && c.m === b.m + 1 && c.d <= 9 && c.d !== b.d),
            y: find(base + 1, (c) => c.y === b.y + 1 && c.m <= 9 && c.m !== b.m && c.d <= 9 && c.d !== b.d),
        },
        months: Array.from({ length: 12 }, (_, i) => find(base - 400, (c) => c.y === b.y && c.m === i + 1)),
        // The same again, at year end: a month named like a number shows itself by December.
        december: (() => {
            const nov = find(base, (c) => c.y === b.y && c.m === 11 && c.d <= 4);
            const dec = find(nov, (c) => c.y === b.y && c.m === 12 && c.d <= 4);
            const n = at(nov);
            return {
                base: dec,
                diffs: {
                    d: [dec, dec + 4],
                    M: [nov, find(nov + 1, (c) => c.m === 12 && c.d <= 9 && c.d !== n.d)],
                    y: [dec, find(dec + 1, (c) => c.y === b.y + 1 && c.m <= 9 && c.d <= 9 && c.d !== at(dec).d)],
                },
            };
        })(),
    };
}
const calendars = {};
const weekMinDays = requireCldr('cldr-core/supplemental/weekData.json').supplemental.weekData.minDays;
function dateEntries(locale) {
    const calendar = dtf(locale, {}).resolvedOptions().calendar;
    const cal = (calendars[calendar] ??= calendarOf(calendar));
    const nu = dtf(locale, {}).resolvedOptions().numberingSystem;
    const native = [...new Intl.NumberFormat(`en-u-nu-${nu}`, { useGrouping: false }).format(9876543210)].reverse();
    const ascii = (text) => [...text].map((c) => (native.includes(c) ? String(native.indexOf(c)) : c)).join('');
    const out = { cal: calendar, digits: native.join('') };
    const lists = {}; // name list → key
    const list = (prefix, names) => {
        const text = names.join('\u001F');
        if (!(text in lists)) {
            const key = `${prefix}${Object.keys(lists).filter((k) => lists[k].startsWith(prefix)).length}`;
            lists[text] = key;
            out[key] = text;
        }
        return `@${lists[text]}`;
    };
    const partsOf = (f, day) => f.formatToParts(day * DAY);
    const monthForms = [
        ...['short', 'long', 'narrow'].flatMap((month) => [dtf(locale, { day: 'numeric', month }), dtf(locale, { month })]),
        ...['medium', 'long'].map((dateStyle) => dtf(locale, { dateStyle })),
    ];
    const monthsOf = (f) => cal.months.map((day) => partsOf(f, day).find((p) => p.type === 'month').value);
    const weekdaysOf = (f) => Array.from({ length: 7 }, (_, i) => partsOf(f, 20454 + ((7 - 4 + i) % 7)).find((p) => p.type === 'weekday').value);
    // A field's token if it's the sample's: its width (days and months are single-digit), or the
    // names it's from; undefined if it isn't the sample's, null for an era (the same for any date).
    const token = (f, part, sample, time) => {
        const c = cal.at(sample);
        const v = ascii(part.value);
        const digits = (n) => [...n].map((d) => native[d]).join('');
        const width = (n, one, two) => (part.value === digits(String(n)) ? one : part.value === digits(String(n).padStart(2, '0')) ? two : undefined);
        switch (part.type) {
            case 'year':
            case 'relatedYear':
                return part.value === digits(String(c.y)) ? 'y' : part.value === digits(String(c.y % 100).padStart(2, '0')) ? 'yy' : undefined;
            case 'month': {
                // Every reading the month fits: a number, or names (as its dates', or of another width:
                // ksh's medium range is "1. – 5. Jannewa"). `sampled` keeps the one each sample fits.
                const number = (pad) => (text) => text.split('\u001F').every((name, i) => name === digits(String(i + 1).padStart(pad, '0')));
                const names = [...new Set([f, ...monthForms].map((g) => monthsOf(g).join('\u001F')))]
                    .filter((text) => text.split('\u001F')[c.m - 1] === part.value && !number(1)(text) && !number(2)(text));
                const readings = [part.value === digits(String(c.m)) && 'M', part.value === digits(String(c.m).padStart(2, '0')) && 'MM', ...names].filter(Boolean);
                return readings.length ? { readings, own: monthsOf(f).join('\u001F') } : undefined;
            }
            case 'day':
                return width(c.d, 'd', 'dd');
            case 'weekday':
                return list('w', weekdaysOf(f));
            case 'hour':
                return time.hour;
            case 'minute':
                return v.length === 2 ? 'mm' : 'm';
            case 'dayPeriod':
                return list('p', [...Array.from({ length: 24 }, (_, h) => h * 60 + 5), 0, 720].map((min) => f.formatToParts(min * 60000).find((p) => p.type === 'dayPeriod')?.value ?? ''));
            case 'era':
                return null;
            default:
                throw new Error(`generate: can't read ${part.type} "${part.value}" in ${locale}`);
        }
    };
    // V8 labels a range's parts unreliably (fa's months are both "shared"): a field is the start's or
    // the end's by its value.
    const tokens = (f, parts, start, end, time) =>
        parts.map((part) => {
            if (part.type === 'literal') return part.value;
            let [t, mark] = [token(f, part, start, time), '\u0001'];
            if (t === undefined && end !== undefined) [t, mark] = [token(f, part, end, time), '\u0002'];
            if (t === undefined) throw new Error(`generate: ${part.type} "${part.value}" in ${locale} is neither date's`);
            return t === null ? part.value : typeof t === 'object' ? { ...t, mark } : mark + t + mark;
        });
    const pattern = (f, parts, start, end, time) => tokens(f, parts, start, end, time).join('');
    // Read at the year's start and again at its end, where a month that's a number there may be a name.
    const sampled = (f, read, early, late) => {
        const [a, b] = [tokens(f, read(...early), ...early), tokens(f, read(...late), ...late)];
        const shape = () => new Error(`generate: ${locale}'s ${JSON.stringify(f.resolvedOptions())} reads differently in December`);
        if (a.length !== b.length) throw shape();
        const fits = a.map((t, i) => {
            if (typeof t !== 'object') return t;
            if (b[i]?.mark !== t.mark) throw shape();
            return { ...t, fits: t.readings.filter((r) => b[i].readings.includes(r)) };
        });
        return fits
            .map((t) => {
                if (typeof t !== 'object') return t;
                let fit = t.fits;
                // Still more than one: as a range's other month reads (dz's November to December is
                // names, though November alone could be a number), else as the dates' own names.
                if (fit.length > 1) {
                    const other = fits.find((o) => typeof o === 'object' && o !== t && o.fits.length === 1 && fit.includes(o.fits[0]));
                    fit = other ? other.fits : fit.includes(t.own) ? [t.own] : fit;
                }
                if (fit.length !== 1) throw new Error(`generate: ${locale}'s month reads as ${fit.length ? fit.join(' or ') : 'nothing'}`);
                const code = fit[0].length <= 2 ? fit[0] : list('m', fit[0].split('\u001F'));
                return t.mark + code + t.mark;
            })
            .join('');
    };
    for (const [key, options] of Object.entries(DATE_PATTERNS)) {
        const f = dtf(locale, options);
        let time;
        if (key === 'time') {
            const h = (hour) => ascii(f.formatToParts(hour * 3600000 + 300000).find((p) => p.type === 'hour').value);
            const cycle = h(0) === '12' ? 'h' : h(0) === '24' ? 'k' : h(13) === '1' ? 'K' : 'H';
            time = { hour: h(1).length === 2 ? cycle + cycle : cycle };
            out[key] = pattern(f, f.formatToParts(13 * 3600000 + 300000), 0, undefined, time);
        } else if (options.year && !('year' in f.resolvedOptions())) out[key] = weekYearPattern(f, options);
        else out[key] = sampled(f, (day) => partsOf(f, day), [cal.base], [cal.december.base]);
    }
    // CLDR gives a pattern or two a week-numbering year, Y (gd's yMMM is "LLL Y"), which V8 can't
    // name, nor break into parts without crashing: it's read from the text, the month from the
    // pattern without a year, and checked on 1 January 2027, still in 2026 by ISO weeks.
    function weekYearPattern(f, options) {
        if (calendar !== 'gregory') throw new Error(`generate: a week year in ${locale}'s ${calendar} calendar`);
        const minDays = weekMinDays[new Intl.Locale(locale).maximize().region] ?? weekMinDays['001'];
        const year = `Y${new Intl.Locale(locale).getWeekInfo().firstDay % 7}/${minDays}`;
        const month = (day) => dtf(locale, { month: options.month }).formatToParts(day * DAY).find((p) => p.type === 'month').value;
        const at = (day, weekYear) => {
            const [text, name] = [ascii(f.format(day * DAY)), month(day)];
            if (text.split(name).length !== 2 || text.split(weekYear).length !== 2) throw new Error(`generate: can't read ${locale}'s "${text}"`);
            return text.replace(name, '\u0001' + list('m', cal.months.map(month)) + '\u0001').replace(weekYear, `\u0001${year}\u0001`);
        };
        const read = at(cal.base, String(cal.at(cal.base).y));
        if (at(20819, '2026') !== read) throw new Error(`generate: ${locale}'s ${JSON.stringify(options)} isn't a week year`);
        return read;
    }
    for (const key of RANGES) {
        const f = dtf(locale, DATE_PATTERNS[key]);
        const read = (start, end) => f.formatRangeToParts(start * DAY, end * DAY);
        for (const [diff, end] of Object.entries(cal.diffs)) out[`${key}~${diff}`] = sampled(f, read, [cal.base, end], cal.december.diffs[diff]);
    }
    return out;
}
const dateLocales = ['und', ...dateLocaleSet];
const dateTable = Object.fromEntries(dateLocales.map((locale) => [locale, dateEntries(locale)]));
const dateInherited = (locale, key) => {
    for (let l = locale; l; l = unitParent(l)) if (dateTable[l]?.[key] !== undefined) return dateTable[l][key];
    return undefined;
};
const dateRecords = [];
for (const locale of dateLocales) {
    const own = Object.entries(dateTable[locale])
        .filter(([key, value]) => locale === 'und' || dateInherited(unitParent(locale), key) !== value)
        .map(([key, value]) => `${key}\u001F${value}\u001E`);
    if (own.length) dateRecords.push(`${locale}\u001D`, ...own);
}
// Weeks start as Intl.Locale's week info says: by the tag's region, or the one its language (and
// script) most likely means. Kept to where that isn't Monday.
const firstDay = (tag) => new Intl.Locale(tag).getWeekInfo().firstDay % 7;
const weekRegions = Object.keys(requireCldr('cldr-core/supplemental/weekData.json').supplemental.weekData.firstDay);
const regionFirstDays = weekRegions
    .filter((region) => /^[A-Z]{2}$/.test(region))
    .map((region) => [region, firstDay(`und-${region}`)])
    .filter(([, day]) => day !== 1)
    .sort(([a], [b]) => (a < b ? -1 : 1));
const likely = requireCldr('cldr-core/supplemental/likelySubtags.json').supplemental.likelySubtags;
const languageFirstDays = {};
// A language in a script is listed where its week differs from the language's (Monday's, if unlisted).
for (const tag of Object.keys(likely).filter((tag) => !/-([A-Z]{2}|\d{3})$/.test(tag)).sort()) {
    const day = firstDay(tag);
    if (day !== (tag.includes('-') ? firstDay(tag.split('-')[0]) : 1)) (languageFirstDays[day] ??= []).push(tag);
}
const dateDataKt = `// ${NOTE}
package dev.rinzai.zen

/**
 * The date patterns Zen formats with, by locale, where they differ from the parent locale's (und,
 * the root, has them all), as Intl resolves them: "locale\\u001D", then "key\\u001Fvalue\\u001E" for
 * each.
 *
 * Keys: cal (the calendar), digits (zero to nine), a pattern for each of short, medium, long, full,
 * day, yMMM, yMMMM, MMM, E, EEEE, EEEEE and time, and for each range (short, medium, long, day) by
 * the field its dates first differ in (short~d, medium~M, day~y…). A pattern's fields are
 * \\u0001code\\u0001, or \\u0002code\\u0002 for a range's end: y yy, Yf/m (a week year, weeks from day f
 * with at least m days in the year), M MM, d dd, h hh H HH K KK k kk, m mm, or @ and the key of the
 * names it takes (m… months, w… weekdays from Sunday, p… day periods by hour at :05, then 0:00 and
 * 12:00). The chunks join into one string.
 */
internal val DateDataChunks: Array<String> = arrayOf(
${chunked(dateRecords).map((c) => `    ${kstr(c)},`).join('\n')}
)

/** The locales Intl.DateTimeFormat has data for (not CLDR's every one). */
internal val IntlDateLocales: Set<String> by lazy { ${kstr(dateLocaleSet.join(' '))}.split(' ').toSet() }

/** The first day of the week in each region where it isn't Monday: 0 for Sunday … 6 for Saturday. */
internal val RegionFirstDays: Map<String, Int> = mapOf(
${regionFirstDays.map(([r, d]) => `    ${kstr(r)} to ${d},`).join('\n')}
)

/** By the day their weeks start: languages whose likely region's don't start on Monday, and languages in a script whose differ from the language's. */
internal val LanguageFirstDays: Map<Int, String> = mapOf(
${Object.entries(languageFirstDays)
    .map(([day, tags]) => `    ${day} to ${kstr(tags.join(' '))},`)
    .join('\n')}
)
`;

// ── Write (or check) ──

const topo = read('tokens/assets/topo.svg');
const outputs = [
    ['web/packages/variables.css', variablesCss],
    ['kotlin/zen/src/commonMain/kotlin/dev/rinzai/zen/Tokens.kt', tokensKt],
    ...Object.entries(iconSet.icons).map(([file, icon]) => [`web/packages/icons/${file}.tsx`, iconTsx(file, icon)]),
    ['kotlin/zen/src/commonMain/kotlin/dev/rinzai/zen/icons/Icons.kt', iconsKt],
    ['kotlin/zen/src/commonMain/kotlin/dev/rinzai/zen/CldrData.kt', cldrDataKt],
    ['kotlin/zen/src/cldrMain/kotlin/dev/rinzai/zen/UnitPatterns.kt', unitPatternsKt],
    ['kotlin/zen/src/desktopMain/kotlin/dev/rinzai/zen/NumberData.kt', numberDataKt],
    ['kotlin/zen/src/commonMain/kotlin/dev/rinzai/zen/CompactData.kt', compactDataKt],
    ['kotlin/zen/src/desktopMain/kotlin/dev/rinzai/zen/DateData.kt', dateDataKt],
    ['web/packages/backdrop/examples/topo.svg', topo],
    ['kotlin/showcase/src/commonMain/composeResources/files/topo.svg', topo],
];
let stale = 0;
for (const [file, content] of outputs) {
    const path = join(root, file);
    if (existsSync(path) && readFileSync(path, 'utf8') === content) continue;
    if (check) {
        console.error(`generate: ${file} is out of date (run pnpm generate)`);
        stale++;
    } else {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content);
        console.log(`generate: wrote ${file}`);
    }
}
if (stale) process.exit(1);
