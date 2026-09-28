import { NavPill, NavPillIndicator, NavPills } from '@rinzai/zen';
import { useState } from 'react';

const PAGES = ['Month', 'Planner', 'Loans', 'Goals', 'Trends'];

/** With a router, pass its link as the child: <NavPill asChild><NavLink to="/goals">Goals</NavLink></NavPill>. */
export default function Default() {
    const [current, setCurrent] = useState('Month');
    return (
        <NavPills aria-label="Main">
            <NavPillIndicator />
            {PAGES.map((page) => (
                <NavPill
                    key={page}
                    href={`#${page.toLowerCase()}`}
                    active={page === current}
                    onClick={(e) => {
                        e.preventDefault();
                        setCurrent(page);
                    }}
                >
                    {page}
                </NavPill>
            ))}
        </NavPills>
    );
}
