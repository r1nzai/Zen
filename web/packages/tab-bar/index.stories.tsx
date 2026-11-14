import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TabBar from './index';

const meta = preview.meta({
    title: 'Components/TabBar',
    component: TabBar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
