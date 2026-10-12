import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import MultipleExample from './examples/Multiple';
import Accordion from './index';

const meta = preview.meta({
    title: 'Components/Accordion',
    component: Accordion,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Multiple = meta.story({ render: () => <MultipleExample /> });
