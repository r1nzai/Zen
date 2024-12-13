import { Meta, StoryObj } from '@storybook/react';

import zen from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Zen',
    component: zen.div,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof zen.div>;

export const Primary: StoryObj<typeof zen.div> = {
    args: {
        children: 'Text Component',
    },
    render: (args) => <zen.div {...args} />,
};
