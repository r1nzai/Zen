import { Meta, StoryObj } from '@storybook/react-vite';

import TextArea from './index';
export default {
    title: 'TextArea',
    component: TextArea,
} as Meta<typeof TextArea>;

export const Primary: StoryObj<typeof TextArea> = {
    args: {
        defaultValue: 'Text Component',
    },
    render: (args) => <TextArea {...args} />,
};
