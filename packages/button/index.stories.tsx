import { Meta, StoryFn } from '@storybook/react';

import Button from './index';
export default {
    component: Button,
} as Meta<typeof Button>;
const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    children: 'Button',
    className: '',
    variant: 'primary',
    size: 'medium',
    rounded: 'md',
};
