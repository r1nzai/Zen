import { createEvent, fireEvent, render, screen } from '@testing-library/react';

import FileDrop, { accepts } from './index';

const file = (name: string, type = '') => new File(['x'], name, { type });

describe('accepts', () => {
    it('matches extensions, types and wildcards', () => {
        expect(accepts(file('a.CSV'), '.csv,.xlsx')).toBe(true);
        expect(accepts(file('a.png', 'image/png'), 'image/*')).toBe(true);
        expect(accepts(file('a.txt', 'text/plain'), 'text/csv')).toBe(false);
        expect(accepts(file('a.txt'))).toBe(true);
    });
});

describe('FileDrop', () => {
    const drop = (target: Element, type: string, files: File[] = []) => {
        const event = createEvent[type as 'drop'](target);
        Object.defineProperty(event, 'dataTransfer', { value: { types: ['Files'], files, dropEffect: '' } });
        fireEvent(target, event);
    };

    it('lights up while files are over it, and takes the allowed dropped ones', () => {
        const onFiles = vi.fn();
        render(
            <FileDrop accept=".csv" onFiles={onFiles} multiple>
                Drop here
            </FileDrop>,
        );
        const zone = screen.getByText('Drop here');
        drop(zone, 'dragEnter');
        expect(zone).toHaveAttribute('data-over');
        drop(zone, 'drop', [file('a.csv'), file('b.png'), file('c.csv')]);
        expect(zone).not.toHaveAttribute('data-over');
        expect(onFiles.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.csv', 'c.csv']);
    });

    it('takes one file unless multiple, and chooses through the file field', () => {
        const onFiles = vi.fn();
        const { container } = render(<FileDrop onFiles={onFiles}>Drop here</FileDrop>);
        const input = container.querySelector('input[type=file]')!;
        fireEvent.change(input, { target: { files: [file('a.csv'), file('b.csv')] } });
        expect(onFiles.mock.calls[0][0]).toHaveLength(1);
    });
});
