import { CalendarIcon, Flag, Settings, TabBar, TabBarItem, TableIcon } from '@rinzai/zen';
import { useState } from 'react';

const TABS = [
    { label: 'Month', icon: <CalendarIcon /> },
    { label: 'Planner', icon: <TableIcon /> },
    { label: 'Goals', icon: <Flag /> },
    { label: 'Settings', icon: <Settings /> },
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
