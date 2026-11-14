import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import IconPicker from './index';

const meta = preview.meta({
    title: 'Components/IconPicker',
    component: IconPicker,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
