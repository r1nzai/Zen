import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Dropdown from './index';
import { Container } from '..';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Dropdown',
    component: Dropdown,
} as Meta<typeof Dropdown>;

export const SingleSelect: StoryFn<typeof Dropdown> = (args) => {
    const [selected, setSelected] = React.useState(args.items[0]);
    args.selected = selected;
    args.onChange = setSelected;
    return <Dropdown {...args} />;
};
SingleSelect.args = {
    items: Array.from({ length: 100 }, (_, i) => ({
        text: `Item ${i + 1}`,
        key: `item${i + 1}`,
    })),
    disabled: false,
};
export const MultiSelect: StoryFn<typeof Dropdown> = (args) => {
    const [selected, setSelected] = React.useState(args.items.slice(0, 2));
    args.selected = selected;
    args.onChange = setSelected;
    return <Dropdown {...args} />;
};

MultiSelect.args = {
    items: Array.from({ length: 100 }, (_, i) => ({
        text: `Item ${i + 1}`,
        key: `item${i + 1}`,
    })),
    disabled: false,
    multiple: true,
};
