import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Dropdown from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    component: Dropdown,
} as Meta<typeof Dropdown>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Dropdown> = (args) => {
    const [selected, setSelected] = React.useState(args.items[0].key);
    args.selectedKey = selected;
    args.onChange = setSelected;
    return <Dropdown {...args} />;
};

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    items: [
        { text: 'Item 1', key: 'item1' },
        { text: 'Item 2', key: 'item2' },
        { text: 'Item 3', key: 'item3' },
    ],
};
