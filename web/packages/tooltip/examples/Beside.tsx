import { Tooltip, TooltipContent, TooltipTrigger } from '@rinzai/zen';
import MusicalNote from '@zen/icons/musical-note';
import QueueList from '@zen/icons/queue-list';
import Search from '@zen/icons/search';
import Squares from '@zen/icons/squares';

const ITEMS = [
    { label: 'Home', icon: Squares },
    { label: 'Search', icon: Search },
    { label: 'Library', icon: MusicalNote },
    { label: 'Up next', icon: QueueList },
];

/**
 * An icon rail, each icon's name in a tooltip beside it (`side="beside"`), clear
 * of the icons below. The name is the button's own label, so it isn't also its description.
 */
export default function Beside() {
    return (
        <nav aria-label="Main" className="glass flex flex-col gap-1 rounded-xl p-1.5">
            {ITEMS.map(({ label, icon: Icon }) => (
                <Tooltip key={label}>
                    <TooltipTrigger
                        aria-label={label}
                        aria-describedby={undefined}
                        className="text-muted-foreground hover:text-foreground hover:bg-tint/[0.07] focus-ring grid size-10 cursor-pointer place-items-center rounded-lg transition-colors"
                    >
                        <Icon className="size-5" />
                    </TooltipTrigger>
                    <TooltipContent side="beside" offset={8}>
                        <p className="px-2.5 py-1.5 text-sm">{label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}
        </nav>
    );
}
