import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Breadcrumbs from './index';

const meta = preview.meta({
    title: 'Components/Breadcrumbs',
    component: Breadcrumbs,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
