import { Pill, PillIndicator, Pills } from '@rinzai/zen';
import { useState } from 'react';

const PAGES = ['Month', 'Planner', 'Loans', 'Goals', 'Trends'];

/**
 * Site navigation: Pills in a <nav>. With a router, pass its link as the child:
 * <Pill asChild><NavLink to="/goals">Goals</NavLink></Pill>.
 */
export default function Navigation() {
    const [current, setCurrent] = useState('Month');
    return (
        <nav aria-label="Main">
            <Pills>
                <PillIndicator />
                {PAGES.map((page) => (
                    <Pill
                        key={page}
                        href={`#${page.toLowerCase()}`}
                        active={page === current}
                        onClick={(e) => {
                            e.preventDefault();
                            setCurrent(page);
                        }}
                    >
                        {page}
                    </Pill>
                ))}
            </Pills>
        </nav>
    );
}
