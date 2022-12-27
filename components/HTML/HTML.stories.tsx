import { Meta, StoryFn } from '@storybook/react'
import React from 'react'

import HTML from './HTML'
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: HTML,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof HTML>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof HTML> = (args) => <HTML {...args} />

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    tag: 'h1',
    children: 'Text Component',
}
