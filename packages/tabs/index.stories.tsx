import preview from '../../.storybook/preview';
import UnderlineExample from './examples/Underline';
import PillsExample from './examples/Pills';
import Tabs from './index';

const meta = preview.meta({
    title: 'Components/Tabs',
    component: Tabs,
});

export const Underline = meta.story({ render: () => <UnderlineExample /> });

export const Pills = meta.story({ render: () => <PillsExample /> });
