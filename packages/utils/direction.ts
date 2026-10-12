/**
 * The key as if the text ran left to right: in right-to-left text ArrowLeft
 * and ArrowRight swap, so "next" follows the reading order. Read from the
 * element's laid-out direction, so a `dir` anywhere above it (or CSS) counts.
 */
export function readingKey(key: string, element: Element): string {
    if ((key !== 'ArrowLeft' && key !== 'ArrowRight') || getComputedStyle(element).direction !== 'rtl') return key;
    return key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
}
