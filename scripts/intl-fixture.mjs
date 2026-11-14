// Writes kotlin/zen/src/desktopTest/resources/intl-{numbers,compact,units,plurals,dates}.tsv: what Intl gives (Node's ICU,
// CLDR 48, as Chrome's) for number and unit formats, plural categories and dates across locales picked for their
// plural rules, CLDR parents and calendars. Kotlin's IntlTest checks its own formatting against it.
// Run: node scripts/intl-fixture.mjs (with --all-dates, dates in every CLDR locale, to check by hand: not kept).
import { readFileSync, writeFileSync } from 'node:fs';

const locales = ['en', 'en-IN', 'en-GB', 'fr', 'fr-CA', 'de', 'es', 'es-MX', 'pt', 'pt-PT', 'it', 'ru', 'uk', 'pl', 'cs', 'sl', 'lt', 'lv', 'ga', 'cy', 'ar', 'he', 'hi', 'bn', 'ja', 'zh', 'zh-Hant-HK', 'ko', 'tr', 'sr-Latn', 'is', 'mt'];
const units = ['day', 'hour', 'minute', 'week', 'month', 'year', 'kilometer', 'meter', 'mile', 'percent', 'byte', 'gigabyte', 'celsius', 'liter', 'fluid-ounce', 'mile-scandinavian'];
const values = [0, 1, 2, 5, 12.5, 21, 1000000, -3];
const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '11', '12', '21', '22', '101', '111', '1000000', '0.5', '1.0', '1.5', '2.10', '0.0'];

const numbers = [];
const amounts = [0, 1, -1, 2.5, 1234.5, -1234.567, 152000, 15200000.5, 0.256, 1.005, 1e9];
const optionSets = [
    ['decimal', '', '', ''],
    ['decimal', '', '0', '2'],
    ['decimal', '', '', '0'],
    ['percent', '', '', ''],
    ['percent', '', '1', '1'],
    ['currency', 'USD', '', ''],
    ['currency', 'EUR', '', ''],
    ['currency', 'INR', '', ''],
    ['currency', 'JPY', '', ''],
    ['currency', 'CHF', '', ''],
    ['currency', 'AED', '', ''],
];
for (const locale of locales)
    for (const [style, currency, min, max] of optionSets)
        for (const grouping of ['true', 'false'])
            for (const value of amounts) {
                // Zen's grouping is Intl's default (auto, minimum grouping digits and all), or off.
                const options = grouping === 'true' ? { style } : { style, useGrouping: false };
                if (currency) options.currency = currency;
                if (min) options.minimumFractionDigits = Number(min);
                if (max) options.maximumFractionDigits = Number(max);
                numbers.push([locale, style, currency, min, max, grouping, value, new Intl.NumberFormat(locale, options).format(value)]);
            }
// Compact numbers, across magnitudes, up to where they round into the next (999,950 is 1M) and past the largest.
const compact = [];
const compactLocales = [...locales, 'ar-EG', 'fa', 'ur', 'sw', 'ckb', 'de-CH', 'es-419'];
const compactAmounts = [0, 1, -1, 0.123456, 9.96, 12.5, 999.5, 1000, 1234, -1234, 1500, 15000, 152000, 420000, -70000, 999950, 1234567, 15200000.5, 1e9, 1.5e18, -2.5e12];
const compactOptions = [
    ['decimal', '', '', ''],
    ['decimal', '', '', '1'],
    ['decimal', '', '2', ''],
    ['currency', 'USD', '', ''],
    ['currency', 'EUR', '', ''],
    ['currency', 'INR', '', '1'],
    ['currency', 'CHF', '', ''],
    ['currency', 'JPY', '', ''],
];
for (const locale of compactLocales)
    for (const [style, currency, min, max] of compactOptions)
        for (const grouping of ['true', 'false'])
            for (const value of compactAmounts) {
                const options = grouping === 'true' ? { style, notation: 'compact' } : { style, notation: 'compact', useGrouping: false };
                if (currency) options.currency = currency;
                if (min) options.minimumFractionDigits = Number(min);
                if (max) options.maximumFractionDigits = Number(max);
                compact.push([locale, style, currency, min, max, grouping, value, new Intl.NumberFormat(locale, options).format(value)]);
            }
const unit = [];
for (const locale of locales)
    for (const u of units)
        for (const display of ['long', 'short', 'narrow'])
            for (const value of values)
                unit.push([locale, u, display, value, new Intl.NumberFormat(locale, { style: 'unit', unit: u, unitDisplay: display }).format(value)]);
const plural = [];
for (const locale of locales)
    for (const d of digits) {
        const fraction = d.split('.')[1]?.length ?? 0;
        plural.push([locale, d, new Intl.PluralRules(locale, { minimumFractionDigits: fraction }).select(Number(d))]);
    }
// Dates as web's utils/date.ts formats them, in the calendars locales default to (th's Buddhist, fa's Persian),
// across year ends (gd's week year), Persian new year, and locales Intl formats as others (az-Arab, en-TH, aa).
const allDates = process.argv.includes('--all-dates');
const dateLocales = allDates
    ? ['und', ...JSON.parse(readFileSync(new URL('../node_modules/cldr-core/availableLocales.json', import.meta.url))).availableLocales.full]
    : [...locales, 'en-US', 'en-TH', 'th', 'fa', 'ps', 'uz-Arab', 'ckb-IR', 'gd', 'az-Arab', 'zh-Hant', 'zh-Hans-HK', 'pa-Arab', 'dv', 'aa', 'und'];
const days = ['2026-09-03', '2026-01-01', '2027-01-01', '2024-02-29', '2025-03-20', '2025-03-21', '1999-12-31', '2031-07-14', '2010-10-10'];
const ranges = [['2026-09-03', '2026-09-10'], ['2026-09-29', '2026-11-02'], ['2026-12-28', '2027-01-05'], ['2025-03-15', '2025-03-25'], ['2010-10-10', '2011-10-11']];
const utc = (date) => Date.parse(`${date}T00:00:00Z`);
const plainSpaces = (text) => text.replace(/[\u2009\u202f]/g, ' ');
const dateFormat = (locale, style) =>
    new Intl.DateTimeFormat(locale, style === 'day' ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { dateStyle: style, timeZone: 'UTC' });
const dates = [];
for (const locale of dateLocales) {
    for (const style of ['day', 'short', 'medium', 'long', 'full'])
        for (const day of days) dates.push(['date', locale, style, day, plainSpaces(dateFormat(locale, style).format(utc(day)))]);
    for (const style of ['day', 'short', 'medium', 'long'])
        for (const [start, end] of ranges) dates.push(['range', locale, style, `${start}/${end}`, plainSpaces(dateFormat(locale, style).formatRange(utc(start), utc(end)))]);
    for (const style of ['short', 'long'])
        for (const day of days)
            dates.push(['month', locale, style, day.slice(0, 7), new Intl.DateTimeFormat(locale, { month: style, year: 'numeric', timeZone: 'UTC' }).format(utc(`${day.slice(0, 7)}-01`))]);
    const months = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });
    dates.push(['monthNames', locale, '', '', Array.from({ length: 12 }, (_, i) => months.format(Date.UTC(2000, i, 1))).join('|')]);
    for (const style of ['narrow', 'short', 'long']) {
        const weekdays = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
        dates.push(['weekdays', locale, style, '', Array.from({ length: 7 }, (_, i) => weekdays.format(Date.UTC(2023, 0, 1 + i))).join('|')]);
    }
    dates.push(['weekStart', locale, '', '', String(new Intl.Locale(locale).getWeekInfo().firstDay % 7)]);
    // TimeField's clock: its parts at 15:05, whether it counts round 12, and its names for 9:05 and 15:05.
    const clock = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
    const at = (h) => clock.formatToParts(Date.UTC(2020, 0, 1, h, 5));
    const period = (h) => plainSpaces(at(h).find((p) => p.type === 'dayPeriod')?.value ?? '');
    const order = at(15).map((p) => (p.type === 'literal' ? plainSpaces(p.value) : `{${p.type}}`)).join('');
    dates.push(['clock', locale, '', '', [order, clock.resolvedOptions().hourCycle?.startsWith('h1') ?? false, period(9), period(15)].join('|')]);
}
const tsv = (rows) => `# ICU ${process.versions.icu}, CLDR ${process.versions.cldr}\n` + rows.map((r) => r.join('\t')).join('\n') + '\n';
const out = (file) => new URL(`../kotlin/zen/src/desktopTest/resources/${file}`, import.meta.url);
writeFileSync(out('intl-dates.tsv'), tsv(dates));
if (allDates) process.exit();
writeFileSync(out('intl-numbers.tsv'), tsv(numbers));
writeFileSync(out('intl-compact.tsv'), tsv(compact));
writeFileSync(out('intl-units.tsv'), tsv(unit));
writeFileSync(out('intl-plurals.tsv'), tsv(plural));
