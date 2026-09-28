import preview from '../../.storybook/preview';
import StatesExample from './examples/States';
import Input from './index';

const meta = preview.meta({
    title: 'Components/Input',
    component: Input,
});

export const Primary = meta.story({
    args: {
        defaultValue: 'Text Component',
    },
});

export const States = meta.story({ render: () => <StatesExample /> });
