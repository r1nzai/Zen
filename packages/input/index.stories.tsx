import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Input from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Input',
    component: Input,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Input>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Input> = (args) => <Input {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    defaultValue: 'Text Component',
};
