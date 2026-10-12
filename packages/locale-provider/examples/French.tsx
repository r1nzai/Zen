import { DatePicker, Field, LocaleProvider, MoneyInput, RepeatPicker } from '@rinzai/zen';

const FRENCH = {
    pickDate: 'Choisir une date',
    chooseDate: 'Choisir la date',
    clear: 'Effacer',
    previousMonth: 'Mois précédent',
    nextMonth: 'Mois suivant',
    chooseMonthAndYear: (month: string) => `${month}, choisir le mois et l’année`,
    enterAmount: 'Saisissez un montant.',
    repeats: 'Répétition',
    every: 'Tous les',
    next: 'Prochaines :',
    repeatUnit: (unit: 'day' | 'week' | 'month' | 'year', count: number) =>
        ({ day: 'jour', week: 'semaine', month: 'mois', year: 'an' })[unit] +
        (count > 1 && unit !== 'month' ? 's' : ''),
    repeatEvery: (every: number, unit: string) => (every === 1 ? `Chaque ${unit}` : `Tous les ${every} ${unit}`),
    repeatOn: (rule: string, when: string) => `${rule} le ${when}`,
};

/**
 * `locale` sets how dates, numbers and money read, and the week's first day;
 * `messages` gives the words. Anything you leave out stays English.
 */
export default function French() {
    return (
        <LocaleProvider locale="fr-FR" messages={FRENCH}>
            <div className="flex w-80 flex-col gap-4">
                <Field label="Date">
                    <DatePicker />
                </Field>
                <Field label="Montant">
                    <MoneyInput currency="EUR" defaultValue={128050} />
                </Field>
                <RepeatPicker defaultValue={{ every: 2, unit: 'week' }} start="2026-10-12" />
            </div>
        </LocaleProvider>
    );
}
