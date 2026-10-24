import { render, screen } from '@testing-library/react';

import TabBar, { TabBarItem } from '../tab-bar';
import PlayerBar from './index';

describe('PlayerBar', () => {
    it('sits on the tab bar, and both keep their heights for the page', () => {
        const { container, unmount } = render(
            <>
                <PlayerBar aria-label="Now playing">Song</PlayerBar>
                <TabBar>
                    <TabBarItem href="/">Home</TabBarItem>
                </TabBar>
            </>,
        );
        expect(screen.getByRole('region', { name: 'Now playing' })).toHaveClass(
            'fixed',
            'bottom-[var(--zen-tab-bar-height,0px)]',
        );
        const root = container.style;
        expect(root.getPropertyValue('--zen-player-bar-height')).toBe('0px');
        expect(root.getPropertyValue('--zen-tab-bar-height')).toBe('0px');
        unmount();
        expect(root.getPropertyValue('--zen-player-bar-height')).toBe('');
        expect(root.getPropertyValue('--zen-tab-bar-height')).toBe('');
    });
});
