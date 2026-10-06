import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import { SortableList } from './index';

const meta = preview.meta({
    title: 'Components/SortableList',
    component: SortableList,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
