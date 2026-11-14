import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import ProgressRing from './index';

const meta = preview.meta({
    title: 'Components/ProgressRing',
    component: ProgressRing,
});

export const Primary = meta.story({
    args: {
        value: 0.64,
        label: 'Savings goal',
        children: <span className="text-sm font-semibold tabular-nums">64%</span>,
    },
});

export const Example = meta.story({ render: () => <DefaultExample /> });
