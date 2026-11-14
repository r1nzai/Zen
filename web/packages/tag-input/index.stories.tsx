import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TagInput from './index';

const meta = preview.meta({
    title: 'Components/TagInput',
    component: TagInput,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
