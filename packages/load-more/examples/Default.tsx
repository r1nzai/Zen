import { LoadMore } from '@rinzai/zen';
import { useState } from 'react';

const PAGE = 12;
const TOTAL = 60;
const entry = (i: number) => ({ id: i, label: `Entry ${i + 1}`, amount: `−$${((i * 37) % 180) + 6}` });

/** Scroll to the end and the next page loads; there's a button for it too. */
export default function Default() {
    const [entries, setEntries] = useState(() => Array.from({ length: PAGE }, (_, i) => entry(i)));
    const [loading, setLoading] = useState(false);
    const more = () => {
        setLoading(true);
        // Stands in for a request.
        setTimeout(() => {
            setEntries((es) => [...es, ...Array.from({ length: PAGE }, (_, i) => entry(es.length + i))]);
            setLoading(false);
        }, 700);
    };
    return (
        <div className="glass glow-edge h-80 w-full max-w-sm overflow-y-auto rounded-xl">
            <ul className="divide-tint/[0.06] divide-y">
                {entries.map((e) => (
                    <li key={e.id} className="flex justify-between px-4 py-2.5 text-sm">
                        <span>{e.label}</span>
                        <span className="tabular-nums">{e.amount}</span>
                    </li>
                ))}
            </ul>
            <LoadMore onLoadMore={more} loading={loading} hasMore={entries.length < TOTAL} />
        </div>
    );
}
