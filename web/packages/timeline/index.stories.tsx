import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Timeline from './index';

const meta = preview.meta({
    title: 'Components/Timeline',
    component: Timeline,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
