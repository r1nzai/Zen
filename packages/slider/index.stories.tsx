import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import HueExample from './examples/Hue';
import Slider from './index';

const meta = preview.meta({
    title: 'Components/Slider',
    component: Slider,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Hue = meta.story({ render: () => <HueExample /> });
