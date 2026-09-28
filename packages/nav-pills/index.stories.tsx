import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import NavPills from './index';

const meta = preview.meta({
    title: 'Components/NavPills',
    component: NavPills,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
