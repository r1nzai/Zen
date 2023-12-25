import { Meta, StoryFn } from '@storybook/react';

import Button from './index';
export default {
    title: 'Button',
    component: Button,
} as Meta<typeof Button>;
const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
    children: 'Button',
    className: '',
    variant: 'default',
    size: 'default',
};
