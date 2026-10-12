import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Toolbar from './index';

const meta = preview.meta({
    title: 'Components/Toolbar',
    component: Toolbar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
