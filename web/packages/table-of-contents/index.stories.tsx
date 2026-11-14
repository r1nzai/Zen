import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TableOfContents from './index';

const meta = preview.meta({
    title: 'Components/TableOfContents',
    component: TableOfContents,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
