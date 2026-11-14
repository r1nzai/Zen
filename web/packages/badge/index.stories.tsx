import preview from '../../.storybook/preview';
import VariantsExample from './examples/Variants';
import Badge from './index';

const meta = preview.meta({
    title: 'Components/Badge',
    component: Badge,
});

export const Primary = meta.story({
    args: {
        children: 'Text Component',
    },
});

export const Variants = meta.story({ render: () => <VariantsExample /> });
