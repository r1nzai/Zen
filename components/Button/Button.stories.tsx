import { Meta, StoryFn } from '@storybook/react'
import React from 'react'

import Button from './Button'
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: Button,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Button>

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Button> = (args) => <Button {...args} />

export const Primary = Template.bind({})
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    children: 'Button',
    className: '',
    textColor: 'slate-500',
    background: 'amber-400',
    hoverBG: 'amber-200',
    hoverTextColor: 'blue-800',
}
