import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SideNav from './index';

const meta = preview.meta({
    title: 'Components/SideNav',
    component: SideNav,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
