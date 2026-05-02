import { Meta, StoryObj } from '@storybook/react-vite';

import Input from './index';
export default {
    title: 'Input',
    component: Input,
} as Meta<typeof Input>;

export const Primary: StoryObj<typeof Input> = {
    args: {
        defaultValue: 'Text Component',
    },
    render: (args) => <Input {...args} />,
};
