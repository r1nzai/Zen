import type { ComponentDoc } from './pages';

/**
 * The Kotlin library's side of the docs: each example's source from the showcase
 * (kotlin/showcase/.../examples/<package>/<Name>.kt), the story that shows it live
 * (Stories.kt, rendered by the web app at /kotlin/demo/), and each part's
 * declaration from the Dokka build's index (served at /kotlin/api/).
 */

const ROOT = '../../kotlin/showcase/src/commonMain/kotlin/dev/rinzai/zen/showcase';

const sources = import.meta.glob<string>(
    '../../kotlin/showcase/src/commonMain/kotlin/dev/rinzai/zen/showcase/examples/*/*.kt',
    { eager: true, query: '?raw', import: 'default' },
);
const registry = import.meta.glob<string>('../../kotlin/showcase/src/commonMain/kotlin/dev/rinzai/zen/showcase/Stories.kt', {
    eager: true,
    query: '?raw',
    import: 'default',
})[`${ROOT}/Stories.kt`];
const dokka =
    import.meta.glob<DokkaPage[]>('../../kotlin/zen/build/dokka/html/scripts/pages.json', {
        eager: true,
        import: 'default',
    })['../../kotlin/zen/build/dokka/html/scripts/pages.json'] ?? [];

interface DokkaPage {
    /** The declaration: "fun Button(onClick: () -> Unit, …)", or a class's name. */
    name: string;
    /** Its fully qualified name. */
    description: string;
    location: string;
}

/** Where the web app and the API reference are served. */
export const KOTLIN_DEMO = '/kotlin/demo/';
export const KOTLIN_API = '/kotlin/api/';

/** The story id showing each example, by "<package>/<Name>". */
const storyOf = new Map(
    [...(registry ?? '').matchAll(/"([\w-]+--[\w-]+)" to \{ dev\.rinzai\.zen\.showcase\.examples\.(\w+)\.(\w+)\(\) \}/g)].map(
        ([, id, pkg, name]) => [`${pkg}/${name}`, id],
    ),
);

/** The showcase package holding a page's Kotlin examples: its web folder without dashes, unless it says otherwise. */
const kotlinPackage = (doc: ComponentDoc) => doc.kotlinPackage || (doc.folder ?? doc.slug).replaceAll('-', '');

export interface KotlinExample {
    name: string;
    /** As shown: without the package line. */
    source: string;
    /** The story rendering it, for the live preview. */
    story?: string;
}

/** A page's Kotlin example of the web example named `name`, if it has one. */
export function kotlinExample(doc: ComponentDoc, name: string): KotlinExample | undefined {
    const pkg = kotlinPackage(doc);
    const source = sources[`${ROOT}/examples/${pkg}/${name}.kt`];
    if (source === undefined) return undefined;
    return { name, source: source.replace(/^package [\w.]+\n\n/, ''), story: storyOf.get(`${pkg}/${name}`) };
}

export interface KotlinPart {
    name: string;
    /** "dev.rinzai.zen.button.Button" */
    qualified: string;
    /** Its declarations, overloads included. */
    signatures: string[];
    /** Its page in the API reference. */
    href: string;
}

/** The library's declarations of a part (a composable or a class), by its simple name. */
export function kotlinPart(name: string): KotlinPart | undefined {
    // Top-level only: dev.rinzai.zen[.<package>].<Name>, not a member or an enum entry.
    const pages = dokka.filter((p) => new RegExp(`^dev\\.rinzai\\.zen(\\.[a-z]+)?\\.${name}$`).test(p.description));
    if (!pages.length) return undefined;
    return {
        name,
        qualified: pages[0].description,
        signatures: pages.map((p) => formatSignature(p.name)),
        href: KOTLIN_API + pages[0].location,
    };
}

/** A declaration with its parameters a line each, as Kotlin style writes a long one. */
export function formatSignature(signature: string) {
    const open = signature.indexOf('(');
    if (open < 0) return signature;
    const params: string[] = [];
    let depth = 0;
    let start = open + 1;
    for (let i = start; i < signature.length; i++) {
        const c = signature[i];
        if ('([{<'.includes(c)) depth++;
        else if (')]}'.includes(c) || (c === '>' && signature[i - 1] !== '-')) {
            if (depth === 0) {
                params.push(signature.slice(start, i).trim());
                const head = signature.slice(0, open + 1);
                const list = params.filter(Boolean);
                return list.length < 2 && head.length + list.join('').length < 80
                    ? signature
                    : `${head}\n${list.map((p) => `    ${p},`).join('\n')}\n${signature.slice(i)}`;
            }
            depth--;
        } else if (c === ',' && depth === 0) {
            params.push(signature.slice(start, i).trim());
            start = i + 1;
        }
    }
    return signature;
}

/**
 * Tells a framed Kotlin app where its frame is in this window, as the page scrolls and resizes, and
 * where the page's backdrop aurora is: its own backdrop then carries on from this page's, no seam.
 */
export function tellHost(frame: HTMLIFrameElement) {
    let queued = 0;
    const tell = () => {
        queued = 0;
        const box = frame.getBoundingClientRect();
        const aurora = document.querySelector('.zen-aurora')?.getAnimations()[0]?.currentTime;
        frame.contentWindow?.postMessage(
            { zenHost: { x: box.left, y: box.top, width: innerWidth, height: innerHeight, aurora: Number(aurora ?? 0) } },
            '*',
        );
    };
    const soon = () => (queued ||= requestAnimationFrame(tell));
    // The app asks once it's listening.
    const asked = (e: MessageEvent) => e.source === frame.contentWindow && e.data?.zenAskHost && soon();
    addEventListener('message', asked);
    frame.addEventListener('load', soon);
    addEventListener('scroll', soon, { passive: true });
    addEventListener('resize', soon);
    const resized = new ResizeObserver(soon);
    resized.observe(frame);
    soon();
    return () => {
        cancelAnimationFrame(queued);
        removeEventListener('message', asked);
        frame.removeEventListener('load', soon);
        removeEventListener('scroll', soon);
        removeEventListener('resize', soon);
        resized.disconnect();
    };
}
