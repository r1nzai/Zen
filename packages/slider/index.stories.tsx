import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import HueExample from './examples/Hue';
import SmallExample from './examples/Small';
import Slider from './index';

const meta = preview.meta({
    title: 'Components/Slider',
    component: Slider,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Hue = meta.story({ render: () => <HueExample /> });

export const Small = meta.story({ render: () => <SmallExample /> });
