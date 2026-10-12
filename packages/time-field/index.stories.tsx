import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import WithDateExample from './examples/WithDate';
import TimeField from './index';

const meta = preview.meta({
    title: 'Components/TimeField',
    component: TimeField,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const WithDate = meta.story({ render: () => <WithDateExample /> });
