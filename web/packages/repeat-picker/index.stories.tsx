import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RepeatPicker from './index';

const meta = preview.meta({
    title: 'Components/RepeatPicker',
    component: RepeatPicker,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
