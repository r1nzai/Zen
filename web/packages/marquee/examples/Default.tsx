import { Marquee } from '@rinzai/zen';

const TRACKS = [
    { title: 'Glass Aurora', artist: 'Halcyon Drift' },
    {
        title: 'The Long Way Home Through the Harbour Lights (Extended Night Mix)',
        artist: 'Mira Vale and the Quiet Hours Orchestra',
    },
    { title: 'Paper Moons', artist: 'Mira Vale' },
];

/**
 * Hover a row, or Tab to it: names too long for it scroll, the rest stay put.
 * `data-zen-marquee-host` makes the whole row the trigger.
 */
export default function Default() {
    return (
        <ul className="flex w-72 flex-col gap-1">
            {TRACKS.map((t) => (
                <li key={t.title}>
                    <a
                        href="#play"
                        data-zen-marquee-host
                        onClick={(e) => e.preventDefault()}
                        className="focus-ring hover:bg-tint/[0.06] flex flex-col rounded-lg px-3 py-2"
                    >
                        <Marquee className="text-sm font-medium">{t.title}</Marquee>
                        <Marquee className="text-muted-foreground text-xs">{t.artist}</Marquee>
                    </a>
                </li>
            ))}
        </ul>
    );
}
