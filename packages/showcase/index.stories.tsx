import preview from '../../.storybook/preview';
import BudgetApp from './examples/BudgetApp';
import MusicApp from './examples/MusicApp';

const meta = preview.meta({
    title: 'Showcase',
    tags: ['!autodocs'],
    parameters: { layout: 'fullscreen' },
});

export const Budget = meta.story({ render: () => <BudgetApp /> });
export const Music = meta.story({ render: () => <MusicApp /> });
