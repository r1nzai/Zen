import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import FileDrop from './index';

const meta = preview.meta({
    title: 'Components/FileDrop',
    component: FileDrop,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
