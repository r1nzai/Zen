import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import EditableCell from './index';

const meta = preview.meta({
    title: 'Components/EditableCell',
    component: EditableCell,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
