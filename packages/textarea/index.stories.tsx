import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TextArea from './index';

const meta = preview.meta({
    title: 'Components/Textarea',
    component: TextArea,
});

export const Primary = meta.story({
    args: {
        defaultValue: 'Text Component',
    },
});

export const Example = meta.story({ render: () => <DefaultExample /> });
