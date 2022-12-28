import { Meta, StoryFn } from '@storybook/react'
import React from 'react'

import Text from './Text'
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: Text,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Text>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Text> = (args) => <Text {...args} />

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    as: 'h1',
    children: 'Text Component',
    size: '1.5rem',
    weight: 400,
    lineHeight: 1.5,
    color: 'black',
}
