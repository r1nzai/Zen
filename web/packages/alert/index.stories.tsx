import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import PlainExample from './examples/Plain';
import Alert from './index';

const meta = preview.meta({
    title: 'Components/Alert',
    component: Alert,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Plain = meta.story({ render: () => <PlainExample /> });
