import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import TextArea from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'TextArea',
    component: TextArea,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof TextArea>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof TextArea> = (args) => <TextArea {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    defaultValue: 'Text Component',
};
