import { SortableHandle, SortableItem, SortableList, useVirtualList } from '@rinzai/zen';
import { useRef, useState } from 'react';

const ROW = 48;
const ARTISTS = ['Nils Frahm', 'Ólafur Arnalds', 'Hania Rani', 'Max Richter', 'Bonobo', 'Tycho', 'Jon Hopkins'];
const SONGS = Object.fromEntries(
    Array.from({ length: 500 }, (_, i) => [`s${i}`, { title: `Track ${i + 1}`, artist: ARTISTS[(i * 3) % 7] }]),
);

/**
 * A queue of 500, rendering only the rows in view: `itemHeight` on the list,
 * and the dragged row kept rendered (`keep`) as it scrolls the list along.
 */
export default function Virtual() {
    const [order, setOrder] = useState(Object.keys(SONGS));
    const [lifted, setLifted] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const rows = useVirtualList({
        count: order.length,
        itemHeight: ROW,
        scrollRef,
        keep: lifted ? order.indexOf(lifted) : undefined,
    });
    return (
        <div ref={scrollRef} className="glass h-96 w-full max-w-md overflow-y-auto rounded-xl">
            <SortableList
                value={order}
                onValueChange={setOrder}
                itemHeight={ROW}
                onLiftedChange={setLifted}
                aria-label="Up next"
                style={{ height: rows.totalSize }}
            >
                {rows.items.map(({ index, start }) => {
                    const id = order[index];
                    const song = SONGS[id];
                    return (
                        <SortableItem
                            key={id}
                            id={id}
                            className="absolute! inset-x-0 flex items-center gap-2 px-1.5"
                            style={{ top: start, height: ROW }}
                        >
                            <SortableHandle id={id} label={song.title} />
                            <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{song.title}</div>
                                <div className="text-muted-foreground truncate text-xs">{song.artist}</div>
                            </div>
                        </SortableItem>
                    );
                })}
            </SortableList>
        </div>
    );
}
