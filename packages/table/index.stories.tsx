import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SortableExample from './examples/Sortable';
import Table from './index';

const meta = preview.meta({
    title: 'Components/Table',
    component: Table,
    parameters: { layout: 'padded' },
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Sortable = meta.story({ render: () => <SortableExample /> });
