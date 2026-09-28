import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import PageHeader from './index';

const meta = preview.meta({
    title: 'Components/PageHeader',
    component: PageHeader,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
