import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import FilterBar from './index';

const meta = preview.meta({
    title: 'Components/FilterBar',
    component: FilterBar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
