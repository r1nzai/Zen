import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import EmptyState from './index';

const meta = preview.meta({
    title: 'Components/EmptyState',
    component: EmptyState,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
