import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RouterExample from './examples/Router';
import NavigationMenu from './index';

const meta = preview.meta({
    title: 'Components/NavigationMenu',
    component: NavigationMenu,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Router = meta.story({ render: () => <RouterExample /> });
