/** Reading packages/<folder>/examples/<Name>.tsx, for the docs pages and the markdown docs alike. */

/** Examples, those named in `order` first, the rest alphabetically. */
export function orderExamples<T extends { name: string }>(examples: T[], order: string[] = []) {
    const rank = (e: T) => (order.includes(e.name) ? order.indexOf(e.name) : order.length);
    return [...examples].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

/** "WithSpinner" → "With spinner" */
export function titleFor(name: string) {
    const words = name.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');
    return [words[0], ...words.slice(1).map((w) => w.toLowerCase())].join(' ');
}

/** The JSDoc right above `export default`, as the example's description. */
export function docComment(source: string) {
    // The body can't contain `*/`, so an earlier comment (on a field, say) isn't swept in.
    const match = source.match(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export default/);
    return match?.[1].replace(/^\s*\* ?/gm, '').trim();
}

/** The Heroicons name a Zen icon file was drawn from ("Heroicons 2.2.0, 24/outline/cog-6-tooth.svg"). */
export const heroiconOf = (code: string) => code.match(/Heroicons [\d.]+, \S+\/([\w-]+)\.svg/)?.[1];

/**
 * The source as shown: examples draw Zen's internal icons, which aren't exported, so
 * their imports become a pointer to Heroicons, naming each one (`heroicon` maps
 * "icons/…" paths to names).
 */
export function shown(source: string, heroicon: (path: string) => string | undefined) {
    const used: string[] = [];
    const rest = source.replace(/^import (\w+) from '@zen\/(icons\/[\w/-]+)';\n/gm, (_, name: string, path: string) => {
        const icon = heroicon(path);
        used.push(icon ? `${name} (${icon})` : name);
        return '';
    });
    if (!used.length) return source;
    const pointer = `// Icons from Heroicons (https://heroicons.com): ${used.join(', ')}.\n`;
    // After the last import, where the icon imports stood.
    const at = [...rest.matchAll(/^import [\s\S]*?;\n/gm)].reduce((_, m) => m.index + m[0].length, 0);
    return rest.slice(0, at) + pointer + rest.slice(at);
}
