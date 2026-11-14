import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import HorizontalExample from './examples/Horizontal';
import RadioGroup from './index';

const meta = preview.meta({
    title: 'Components/RadioGroup',
    component: RadioGroup,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Horizontal = meta.story({ render: () => <HorizontalExample /> });
