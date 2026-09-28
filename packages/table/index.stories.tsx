import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Table from './index';

const meta = preview.meta({
    title: 'Components/Table',
    component: Table,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
