import { fireEvent, render, screen } from '@testing-library/react';

import Tabs, { TabList, Tab } from '@zen/tabs';

import { readingKey } from './direction';

describe('readingKey', () => {
    it('swaps left and right only in right-to-left text', () => {
        const ltr = document.createElement('div');
        const rtl = document.createElement('div');
        rtl.style.direction = 'rtl';
        document.body.append(ltr, rtl);
        expect(readingKey('ArrowLeft', ltr)).toBe('ArrowLeft');
        expect(readingKey('ArrowLeft', rtl)).toBe('ArrowRight');
        expect(readingKey('ArrowRight', rtl)).toBe('ArrowLeft');
        expect(readingKey('ArrowUp', rtl)).toBe('ArrowUp');
    });

    it('ArrowLeft moves to the next tab in right-to-left', () => {
        render(
            <div style={{ direction: 'rtl' }}>
                <Tabs defaultValue="a">
                    <TabList>
                        <Tab value="a">A</Tab>
                        <Tab value="b">B</Tab>
                    </TabList>
                </Tabs>
            </div>,
        );
        screen.getByRole('tab', { name: 'A' }).focus();
        fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowLeft' });
        expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    });
});
