import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import DollarsExample from './examples/Dollars';
import CurrencyMenuExample from './examples/CurrencyMenu';
import CompactExample from './examples/Compact';
import MoneyInput from './index';

const meta = preview.meta({
    title: 'Components/MoneyInput',
    component: MoneyInput,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Dollars = meta.story({ render: () => <DollarsExample /> });

export const CurrencyMenu = meta.story({ render: () => <CurrencyMenuExample /> });

export const Compact = meta.story({ render: () => <CompactExample /> });
