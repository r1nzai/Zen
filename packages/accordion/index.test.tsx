import { fireEvent, render, screen } from '@testing-library/react';

import Accordion, { AccordionContent, AccordionItem, AccordionTrigger, type AccordionProps } from './index';

function Example(props: Partial<AccordionProps>) {
    return (
        <Accordion {...(props as AccordionProps)}>
            {['One', 'Two', 'Three'].map((name) => (
                <AccordionItem key={name} value={name.toLowerCase()}>
                    <AccordionTrigger>{name}</AccordionTrigger>
                    <AccordionContent>{name} body</AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    );
}

const trigger = (name: string) => screen.getByRole('button', { name });

describe('Accordion', () => {
    it('triggers are buttons in headings, linked to their open content', () => {
        render(<Example defaultValue="one" />);
        expect(screen.getByRole('heading', { level: 3, name: 'One' })).toContainElement(trigger('One'));
        expect(trigger('One')).toHaveAttribute('aria-expanded', 'true');
        expect(document.getElementById(trigger('One').getAttribute('aria-controls')!)).toHaveTextContent('One body');
        expect(trigger('Two')).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Two body')).toBeNull();
    });

    it('opens one at a time, and closes the open one', () => {
        const onValueChange = vi.fn();
        render(<Example defaultValue="one" onValueChange={onValueChange} />);
        fireEvent.click(trigger('Two'));
        expect(trigger('Two')).toHaveAttribute('aria-expanded', 'true');
        expect(trigger('One')).toHaveAttribute('aria-expanded', 'false');
        expect(onValueChange).toHaveBeenLastCalledWith('two');
        fireEvent.click(trigger('Two'));
        expect(onValueChange).toHaveBeenLastCalledWith(null);
    });

    it('with `multiple`, each opens on its own', () => {
        const onValueChange = vi.fn();
        render(<Example multiple defaultValue={['one']} onValueChange={onValueChange} />);
        fireEvent.click(trigger('Three'));
        expect(onValueChange).toHaveBeenLastCalledWith(['one', 'three']);
        expect(trigger('One')).toHaveAttribute('aria-expanded', 'true');
        expect(trigger('Three')).toHaveAttribute('aria-expanded', 'true');
    });

    it('follows `value`', () => {
        const { rerender } = render(<Example value="one" />);
        fireEvent.click(trigger('Two'));
        expect(trigger('Two')).toHaveAttribute('aria-expanded', 'false');
        rerender(<Example value="two" />);
        expect(trigger('Two')).toHaveAttribute('aria-expanded', 'true');
    });

    it('arrow keys move between headings, wrapping; Home and End jump', () => {
        render(<Example />);
        trigger('One').focus();
        fireEvent.keyDown(trigger('One'), { key: 'ArrowDown' });
        expect(trigger('Two')).toHaveFocus();
        fireEvent.keyDown(trigger('Two'), { key: 'End' });
        expect(trigger('Three')).toHaveFocus();
        fireEvent.keyDown(trigger('Three'), { key: 'ArrowDown' });
        expect(trigger('One')).toHaveFocus();
        fireEvent.keyDown(trigger('One'), { key: 'ArrowUp' });
        expect(trigger('Three')).toHaveFocus();
    });
});
