import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import AnimatedNumber from './index';

const meta = preview.meta({
    title: 'Components/AnimatedNumber',
    component: AnimatedNumber,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
