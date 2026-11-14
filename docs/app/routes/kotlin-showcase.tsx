import { Spinner } from '@rinzai/zen';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';

import { ShowcaseNav } from '../components/showcase-nav';
import { KOTLIN_DEMO, tellHost } from '../kotlin';
import { showcasePath } from '../pages';
import { seo } from '../seo';

const APPS = {
    budget: {
        title: 'Showcase: a budget app built with Zen for Kotlin',
        description:
            'The budget app, built only from Zen’s Compose Multiplatform components and running live on wasm: sortable, editable tables, tree rows with meters, dialogs, pickers and a live theme editor.',
        path: showcasePath('', 'kotlin'),
    },
    music: {
        title: 'Showcase: a music app built with Zen for Kotlin',
        description:
            'The music player, built only from Zen’s Compose Multiplatform components and running live on wasm: a player bar with seek and volume, shuffle and repeat, a queue and mixes in a carousel.',
        path: showcasePath('music', 'kotlin'),
    },
};

const appOf = (pathname: string) => (pathname.includes('/music/') ? 'music' : 'budget');

export const meta = ({ location }: { location: { pathname: string } }) => seo(APPS[appOf(location.pathname)]);

const themeOf = () => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

/**
 * A showcase app from the Kotlin library: the showcase's web app (Compose on wasm), without its own
 * top bar, as tall as the window under the site's header. It scrolls inside, so its fixed bars (the
 * player, the phone tab bar) stay at the bottom of the screen as they do in the web showcase.
 */
export default function KotlinShowcase() {
    const app = appOf(useLocation().pathname);
    const frame = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState<string>();
    const [height, setHeight] = useState<number>();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setSrc(`${KOTLIN_DEMO}?app=${app}&nav=0&theme=${themeOf()}`);
    }, [app]);

    useEffect(() => (src && frame.current ? tellHost(frame.current) : undefined), [src]);

    useEffect(() => {
        const header = document.querySelector<HTMLElement>('.zen__header');
        const fit = () => setHeight(innerHeight - (header?.offsetHeight ?? 0));
        fit();
        addEventListener('resize', fit);
        // The site's theme toggle switches the app's too.
        const theme = new MutationObserver(() => frame.current?.contentWindow?.postMessage({ zenTheme: themeOf() }, '*'));
        theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            removeEventListener('resize', fit);
            theme.disconnect();
        };
    }, []);

    return (
        <>
            <ShowcaseNav />
            <div className="relative mt-6 md:mt-10" style={{ height }}>
                {src && (
                    <iframe
                        key={app}
                        ref={frame}
                        src={src}
                        title={app === 'music' ? 'Music app' : 'Budget app'}
                        className="block size-full border-0"
                        onLoad={() => setLoaded(true)}
                    />
                )}
                {!loaded && (
                    <div className="absolute inset-0 grid place-items-center">
                        <Spinner />
                    </div>
                )}
            </div>
        </>
    );
}
