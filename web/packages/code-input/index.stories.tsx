import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import CodeInput from './index';

const meta = preview.meta({
    title: 'Components/CodeInput',
    component: CodeInput,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
