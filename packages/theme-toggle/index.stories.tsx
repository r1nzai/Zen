import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import ThemeToggle from './index';

const meta = preview.meta({
    title: 'Components/ThemeToggle',
    component: ThemeToggle,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
