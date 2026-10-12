import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SeveralExample from './examples/Several';
import Carousel from './index';

const meta = preview.meta({
    title: 'Components/Carousel',
    component: Carousel,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Several = meta.story({ render: () => <SeveralExample /> });
