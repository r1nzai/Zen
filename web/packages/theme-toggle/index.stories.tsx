import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import YourStateExample from './examples/YourState';
import ThemeToggle from './index';

const meta = preview.meta({
    title: 'Components/ThemeToggle',
    component: ThemeToggle,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const YourState = meta.story({ render: () => <YourStateExample /> });
