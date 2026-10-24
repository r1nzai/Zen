import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import OnTabBarExample from './examples/OnTabBar';
import PlayerBar from './index';

const meta = preview.meta({
    title: 'Components/PlayerBar',
    component: PlayerBar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const OnTabBar = meta.story({ render: () => <OnTabBarExample /> });
