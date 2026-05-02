import { Meta, StoryFn, StoryObj } from '@storybook/react-vite';

import Button from './index';
export default {
    title: 'Button',
    component: Button,
} as Meta<typeof Button>;
export const Primary: StoryObj<typeof Button> = {
    args: {
        children: 'Button',
        className: '',
        variant: 'default',
        size: 'default',
        onClick: () => {
            console.log('clicked');
        },
    },
    render: (args) => <Button {...args} />,
};
