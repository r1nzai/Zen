import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RangeSlider from './index';

const meta = preview.meta({
    title: 'Components/RangeSlider',
    component: RangeSlider,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
