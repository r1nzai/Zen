import preview from '../../.storybook/preview';
import GoalExample from './examples/Goal';
import StatsExample from './examples/Stats';
import Card from './index';

const meta = preview.meta({
    title: 'Components/Card',
    component: Card,
    parameters: { layout: 'padded' },
});

export const Goal = meta.story({ render: () => <GoalExample /> });

export const Stats = meta.story({ render: () => <StatsExample /> });
