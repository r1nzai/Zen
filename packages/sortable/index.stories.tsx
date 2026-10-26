import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import VirtualExample from './examples/Virtual';
import { SortableList } from './index';

const meta = preview.meta({
    title: 'Components/SortableList',
    component: SortableList,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Virtual = meta.story({ render: () => <VirtualExample /> });
