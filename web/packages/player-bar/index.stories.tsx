import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import OnTabBarExample from './examples/OnTabBar';
import PlayerBar from './index';

const meta = preview.meta({
    title: 'Components/PlayerBar',
    component: PlayerBar,
});

// Full width, which a centred story shrinks to nothing (its bar is fixed, out of the flow).
export const Default = meta.story({ parameters: { layout: 'padded' }, render: () => <DefaultExample /> });
export const OnTabBar = meta.story({ render: () => <OnTabBarExample /> });
