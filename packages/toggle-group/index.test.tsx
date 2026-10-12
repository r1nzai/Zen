import { fireEvent, render, screen } from '@testing-library/react';

import ToggleGroup, { ToggleGroupItem, type ToggleGroupProps } from './index';

function Example(props: Partial<ToggleGroupProps>) {
    return (
        <ToggleGroup aria-label="Show" {...(props as ToggleGroupProps)}>
            <ToggleGroupItem value="a">A</ToggleGroupItem>
            <ToggleGroupItem value="b">B</ToggleGroupItem>
            <ToggleGroupItem value="c" disabled>
                C
            </ToggleGroupItem>
            <ToggleGroupItem value="d">D</ToggleGroupItem>
        </ToggleGroup>
    );
}
const item = (name: string) => screen.getByRole('button', { name });

describe('ToggleGroup', () => {
    it('is a named group of toggle buttons', () => {
        render(<Example defaultValue="b" />);
        expect(screen.getByRole('group', { name: 'Show' })).toBeInTheDocument();
        expect(item('B')).toHaveAttribute('aria-pressed', 'true');
        expect(item('A')).toHaveAttribute('aria-pressed', 'false');
    });

    it('presses at most one, and releases it again', () => {
        const onValueChange = vi.fn();
        render(<Example defaultValue="a" onValueChange={onValueChange} />);
        fireEvent.click(item('B'));
        expect(item('B')).toHaveAttribute('aria-pressed', 'true');
        expect(item('A')).toHaveAttribute('aria-pressed', 'false');
        fireEvent.click(item('B'));
        expect(onValueChange).toHaveBeenLastCalledWith(null);
    });

    it('with `multiple`, presses any number', () => {
        const onValueChange = vi.fn();
        render(<Example multiple defaultValue={['a']} onValueChange={onValueChange} />);
        fireEvent.click(item('D'));
        expect(onValueChange).toHaveBeenLastCalledWith(['a', 'd']);
        fireEvent.click(item('A'));
        expect(onValueChange).toHaveBeenLastCalledWith(['d']);
    });

    it('one tab stop, the pressed item; arrow keys skip disabled ones and wrap', () => {
        render(<Example defaultValue="b" />);
        expect(item('B')).toHaveAttribute('tabindex', '0');
        expect(item('A')).toHaveAttribute('tabindex', '-1');
        item('B').focus();
        fireEvent.keyDown(item('B'), { key: 'ArrowRight' });
        expect(item('D')).toHaveFocus();
        expect(item('D')).toHaveAttribute('tabindex', '0');
        expect(item('B')).toHaveAttribute('tabindex', '-1');
        fireEvent.keyDown(item('D'), { key: 'ArrowRight' });
        expect(item('A')).toHaveFocus();
        fireEvent.keyDown(item('A'), { key: 'End' });
        expect(item('D')).toHaveFocus();
    });

    it('with nothing pressed, the first item is the tab stop', () => {
        render(<Example />);
        expect(item('A')).toHaveAttribute('tabindex', '0');
        expect(item('D')).toHaveAttribute('tabindex', '-1');
    });

    it('submits the pressed values with a form', () => {
        render(
            <form data-testid="form">
                <Example multiple name="kind" defaultValue={['a', 'd']} />
            </form>,
        );
        const data = new FormData(screen.getByTestId('form') as HTMLFormElement);
        expect(data.getAll('kind')).toEqual(['a', 'd']);
    });
});
