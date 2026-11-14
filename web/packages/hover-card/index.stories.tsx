import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TrendExample from './examples/Trend';
import HoverCard from './index';

const meta = preview.meta({
    title: 'Components/HoverCard',
    component: HoverCard,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Trend = meta.story({ render: () => <TrendExample /> });
