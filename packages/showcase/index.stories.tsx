import preview from '../../.storybook/preview';
import BudgetApp from './examples/BudgetApp';

const meta = preview.meta({
    title: 'Showcase',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
});

export const Budget = meta.story({ render: () => <BudgetApp /> });
