import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import HoverCard from './index';

const meta = preview.meta({
    title: 'Components/HoverCard',
    component: HoverCard,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
