import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Typography from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Typography',
    component: Typography,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Typography>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Typography> = (args) => <Typography {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    children: 'Text Component',
    variant: 'p',
};
