import { TabBar, TabBarItem } from '@rinzai/zen';
import { useState } from 'react';

const icon = (d: string) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
    >
        <path d={d} />
    </svg>
);

const TABS = [
    { label: 'Month', icon: icon('M4 6h16M4 12h16M4 18h10') },
    { label: 'Planner', icon: icon('M4 4h16v16H4zM4 10h16M10 4v16') },
    {
        label: 'Goals',
        icon: icon('M12 3v3m0 12v3m9-9h-3M6 12H3m15.4-6.4-2.1 2.1M7.7 16.3l-2.1 2.1m0-12.8 2.1 2.1m8.6 8.6 2.1 2.1'),
    },
    {
        label: 'Settings',
        icon: icon(
            'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
        ),
    },
];

/** Phone navigation. Fixed to the bottom of the screen; here it sits in a phone-sized frame. */
export default function Default() {
    const [current, setCurrent] = useState('Month');
    return (
        <div className="border-tint/10 relative h-72 w-80 [transform:translateZ(0)] overflow-hidden rounded-2xl border">
            <p className="text-muted-foreground p-4 text-sm">{current}</p>
            <TabBar aria-label="Main" hideFrom={false} className="absolute! rounded-b-[15px]">
                {TABS.map((t) => (
                    <TabBarItem
                        key={t.label}
                        href={`#${t.label.toLowerCase()}`}
                        icon={t.icon}
                        active={t.label === current}
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrent(t.label);
                        }}
                    >
                        {t.label}
                    </TabBarItem>
                ))}
            </TabBar>
        </div>
    );
}
