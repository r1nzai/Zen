import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import CommandPalette from './index';

const meta = preview.meta({
    title: 'Components/CommandPalette',
    component: CommandPalette,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
