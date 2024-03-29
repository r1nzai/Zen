import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Container from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Container',
    component: Container,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Container>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Container> = (args) => <Container {...args} />;

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    children: 'Text Component',
};
