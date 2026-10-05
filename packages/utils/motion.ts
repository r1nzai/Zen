/** Whether to skip motion: the OS setting, or an app's own switch (html.reduce-motion). */
export function reducedMotion(): boolean {
    return (
        typeof window !== 'undefined' &&
        (!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
            document.documentElement.classList.contains('reduce-motion'))
    );
}
