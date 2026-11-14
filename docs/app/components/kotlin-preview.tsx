import { Spinner } from '@rinzai/zen';
import { useEffect, useRef, useState } from 'react';

import { KOTLIN_DEMO, tellHost } from '../kotlin';

/** The web preview's padding (p-6 md:p-10) and least height (min-h-40 md:min-h-56). */
const frameOf = () => (matchMedia('(min-width: 48rem)').matches ? { pad: 40, min: 224 } : { pad: 24, min: 160 });

const themeOf = () => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

/**
 * A Kotlin example running live: the showcase's web app (Compose on wasm) in a frame, made as
 * tall as the example, in the page's theme. It loads once it's near the screen.
 */
export function KotlinPreview({ story, title }: { story: string; title: string }) {
    const holder = useRef<HTMLDivElement>(null);
    const frame = useRef<HTMLIFrameElement>(null);
    const [src, setSrc] = useState<string>();
    const [height, setHeight] = useState<number>();
    const [fit, setFit] = useState(() => (typeof window === 'undefined' ? { pad: 40, min: 224 } : frameOf()));

    // The frame loads with the first fit; later ones are sent to it as the page resizes.
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                observer.disconnect();
                setSrc(`${KOTLIN_DEMO}?story=${story}&layout=docs&pad=${fit.pad}&vw=${innerWidth}&theme=${themeOf()}`);
            },
            { rootMargin: '400px' },
        );
        observer.observe(holder.current!);
        return () => observer.disconnect();
    }, [story]);

    useEffect(() => {
        if (!src) return;
        const onMessage = (e: MessageEvent<{ zenHeight?: number }>) => {
            if (e.source === frame.current?.contentWindow && typeof e.data?.zenHeight === 'number')
                setHeight(e.data.zenHeight);
        };
        addEventListener('message', onMessage);
        // The page's theme toggle switches the example's too.
        const root = document.documentElement;
        const theme = new MutationObserver(() =>
            frame.current?.contentWindow?.postMessage({ zenTheme: themeOf() }, '*'),
        );
        theme.observe(root, { attributes: true, attributeFilter: ['class'] });
        // Its breakpoints follow this page's viewport, as the web examples' do.
        const onResize = () => {
            const next = frameOf();
            setFit(next);
            frame.current?.contentWindow?.postMessage({ zenViewport: innerWidth, zenPad: next.pad }, '*');
        };
        addEventListener('resize', onResize);
        const untell = tellHost(frame.current!);
        return () => {
            untell();
            removeEventListener('resize', onResize);
            removeEventListener('message', onMessage);
            theme.disconnect();
        };
    }, [src]);

    // Laid out as the web preview is: the example and its padding, at least the preview's least height.
    return (
        <div ref={holder} className="relative grid min-h-40 md:min-h-56">
            {src && (
                <iframe
                    ref={frame}
                    src={src}
                    title={title}
                    className="block w-full border-0"
                    style={{ height: height === undefined ? undefined : Math.max(fit.min, height) }}
                />
            )}
            {height === undefined && (
                <div className="absolute inset-0 grid place-items-center">
                    <Spinner />
                </div>
            )}
        </div>
    );
}
