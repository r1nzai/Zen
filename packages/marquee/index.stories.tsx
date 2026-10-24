import preview from '../../.storybook/preview';
import AlwaysExample from './examples/Always';
import DefaultExample from './examples/Default';
import Marquee from './index';

const meta = preview.meta({
    title: 'Components/Marquee',
    component: Marquee,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Always = meta.story({ render: () => <AlwaysExample /> });
