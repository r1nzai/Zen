import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Pagination from './index';

const meta = preview.meta({
    title: 'Components/Pagination',
    component: Pagination,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
