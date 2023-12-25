import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Toggle from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: Toggle,
} as Meta<typeof Toggle>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Toggle> = (args) => <Toggle {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {};
