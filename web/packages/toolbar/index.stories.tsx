import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import VerticalExample from './examples/Vertical';
import Toolbar from './index';

const meta = preview.meta({
    title: 'Components/Toolbar',
    component: Toolbar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Vertical = meta.story({ render: () => <VerticalExample /> });
