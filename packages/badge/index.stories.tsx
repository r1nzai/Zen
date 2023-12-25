import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Badge from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Badge',
    component: Badge,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Badge>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Badge> = (args) => <Badge {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    children: 'Text Component',
};
