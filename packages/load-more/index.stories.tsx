import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import LoadMore from './index';

const meta = preview.meta({
    title: 'Components/LoadMore',
    component: LoadMore,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
