import preview from '../../.storybook/preview';
import BalanceExample from './examples/Balance';
import CashflowExample from './examples/Cashflow';
import LinesExample from './examples/Lines';
import DonutExample from './examples/Donut';
import Chart from './index';

const meta = preview.meta({
    title: 'Components/Chart',
    component: Chart,
});

export const Balance = meta.story({ render: () => <BalanceExample /> });

export const Cashflow = meta.story({ render: () => <CashflowExample /> });

export const Lines = meta.story({ render: () => <LinesExample /> });

export const Donut = meta.story({ render: () => <DonutExample /> });
