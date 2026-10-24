import { Marquee } from '@rinzai/zen';

/** `trigger="always"` keeps it moving, for what's playing: to the end, a pause, and back. */
export default function Always() {
    return (
        <div className="border-tint/10 flex w-56 items-center gap-3 rounded-xl border p-3">
            <div className="from-primary size-10 shrink-0 rounded-md bg-linear-135 to-fuchsia-400" />
            <div className="min-w-0">
                <Marquee trigger="always" className="text-sm font-medium">
                    The Long Way Home Through the Harbour Lights
                </Marquee>
                <Marquee trigger="always" className="text-muted-foreground text-xs">
                    Mira Vale
                </Marquee>
            </div>
        </div>
    );
}
