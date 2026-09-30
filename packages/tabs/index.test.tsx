import { fireEvent, render, screen } from '@testing-library/react';

import Tabs, { Tab, TabList, TabPanel } from './index';

function Example(props: { value?: string; onValueChange?: (v: string) => void }) {
    return (
        <Tabs defaultValue="month" {...props}>
            <TabList>
                <Tab value="month">Month</Tab>
                <Tab value="year">Year</Tab>
                <Tab value="all">All time</Tab>
            </TabList>
            <TabPanel value="month">Month panel</TabPanel>
            <TabPanel value="year">Year panel</TabPanel>
            <TabPanel value="all">All panel</TabPanel>
        </Tabs>
    );
}

describe('Tabs', () => {
    it('shows the default tab and links it to its panel', () => {
        render(<Example />);
        const tab = screen.getByRole('tab', { name: 'Month' });
        expect(tab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tabpanel', { name: 'Month' })).toHaveTextContent('Month panel');
        expect(screen.queryByText('Year panel')).not.toBeInTheDocument();
    });

    it('switches on click', () => {
        const onValueChange = vi.fn();
        render(<Example onValueChange={onValueChange} />);
        fireEvent.click(screen.getByRole('tab', { name: 'Year' }));
        expect(onValueChange).toHaveBeenCalledWith('year');
        expect(screen.getByText('Year panel')).toBeInTheDocument();
    });

    it('only the active tab is in the tab order', () => {
        render(<Example />);
        expect(screen.getByRole('tab', { name: 'Month' })).toHaveAttribute('tabindex', '0');
        expect(screen.getByRole('tab', { name: 'Year' })).toHaveAttribute('tabindex', '-1');
    });

    it('arrow keys move and select, wrapping at the ends', () => {
        render(<Example />);
        const month = screen.getByRole('tab', { name: 'Month' });
        month.focus();
        fireEvent.keyDown(month, { key: 'ArrowRight' });
        expect(screen.getByRole('tab', { name: 'Year' })).toHaveFocus();
        expect(screen.getByText('Year panel')).toBeInTheDocument();
        fireEvent.keyDown(document.activeElement!, { key: 'End' });
        expect(screen.getByRole('tab', { name: 'All time' })).toHaveFocus();
        fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' });
        expect(month).toHaveFocus();
    });

    it('can be controlled', () => {
        const { rerender } = render(<Example value="year" />);
        expect(screen.getByText('Year panel')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('tab', { name: 'All time' }));
        expect(screen.getByText('Year panel')).toBeInTheDocument();
        rerender(<Example value="all" />);
        expect(screen.getByText('All panel')).toBeInTheDocument();
    });

    it('pills variant: glass track, tabs above the sliding pill', () => {
        render(
            <Tabs defaultValue="a">
                <TabList variant="pills">
                    <Tab value="a">A</Tab>
                    <Tab value="b">B</Tab>
                </TabList>
            </Tabs>,
        );
        expect(screen.getByRole('tablist')).toHaveClass('rounded-full', 'bg-tint/[0.03]');
        expect(screen.getByRole('tab', { name: 'A' })).toHaveClass('rounded-full', 'z-10');
        expect(screen.getByRole('tablist').querySelector('[aria-hidden]')).not.toBeNull();
    });

    it('underline variant: a bar under the active tab', () => {
        render(<Example />);
        expect(screen.getByRole('tablist').querySelector('[aria-hidden]')).toHaveClass('bg-primary');
    });

    it('arrow keys still work with the pills variant', () => {
        render(
            <Tabs defaultValue="a">
                <TabList variant="pills">
                    <Tab value="a">A</Tab>
                    <Tab value="b">B</Tab>
                </TabList>
            </Tabs>,
        );
        screen.getByRole('tab', { name: 'A' }).focus();
        fireEvent.keyDown(screen.getByRole('tab', { name: 'A' }), { key: 'ArrowRight' });
        expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
    });
});
