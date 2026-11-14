import { render, screen } from '@testing-library/react';

import Calendar from '@zen/calendar';
import DatePicker from '@zen/date-picker';
import Pagination from '@zen/pagination';
import { ENGLISH } from '@zen/utils/messages';
import { describeRepeat } from '@zen/utils/repeat';

import LocaleProvider, { useLocale, useMessages } from './index';

function Probe() {
    return <span>{`${useLocale()} ${useMessages().clear}`}</span>;
}

describe('LocaleProvider', () => {
    it('defaults to en-US and English', () => {
        render(<Probe />);
        expect(screen.getByText('en-US Clear')).toBeInTheDocument();
    });

    it('replaces the words given and keeps the rest', () => {
        render(
            <LocaleProvider messages={{ pickDate: 'Choisir une date' }}>
                <DatePicker />
            </LocaleProvider>,
        );
        expect(screen.getByRole('button', { name: /Choisir une date/ })).toBeInTheDocument();
    });

    it('a nested provider overrides only what it sets', () => {
        render(
            <LocaleProvider locale="fr-FR" messages={{ clear: 'Effacer' }}>
                <LocaleProvider locale="de-DE">
                    <Probe />
                </LocaleProvider>
            </LocaleProvider>,
        );
        expect(screen.getByText('de-DE Effacer')).toBeInTheDocument();
    });

    it("formats with its locale; a component's own locale wins", () => {
        const { rerender } = render(
            <LocaleProvider locale="fr-FR">
                <Calendar defaultValue="2026-10-12" />
            </LocaleProvider>,
        );
        expect(screen.getByText('octobre 2026')).toBeInTheDocument();
        rerender(
            <LocaleProvider locale="fr-FR">
                <Calendar defaultValue="2026-10-12" locale="en-US" />
            </LocaleProvider>,
        );
        expect(screen.getByText('October 2026')).toBeInTheDocument();
    });

    it('words that take a value are functions', () => {
        render(
            <LocaleProvider messages={{ page: (n) => `Seite ${n}` }}>
                <Pagination page={2} count={3} onPageChange={() => {}} />
            </LocaleProvider>,
        );
        expect(screen.getByRole('button', { name: 'Seite 3' })).toBeInTheDocument();
    });
});

describe('describeRepeat', () => {
    it('is English by default, and in the words given', () => {
        expect(describeRepeat({ every: 2, unit: 'week', weekdays: [1, 3] }, 'en-US')).toBe('Every 2 weeks on Mon, Wed');
        const fr = { ...ENGLISH, repeatOn: (rule: string, when: string) => `${rule} le ${when}` };
        expect(describeRepeat({ every: 1, unit: 'month', day: 3 }, 'fr-FR', undefined, fr)).toBe(
            'Every month le day 3',
        );
    });
});
