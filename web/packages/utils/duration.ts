/** Seconds as a clock reads them: 3:07, or 1:02:07 from an hour up. */
export function formatDuration(seconds: number) {
    const total = Math.floor(Math.max(seconds, 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = String(total % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}
