import preview from '../../.storybook/preview';
import BudgetExample from './examples/Budget';
import Meter from './index';

const meta = preview.meta({
    title: 'Components/Meter',
    component: Meter,
});

export const Budget = meta.story({ render: () => <BudgetExample /> });
