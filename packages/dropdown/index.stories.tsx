import { Meta, StoryFn } from '@storybook/react';
import React from 'react';

import Dropdown from './index';
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
    const [items, setItems] = React.useState(args.items);
    args.selected = selected;
    args.onChange = setSelected;
    return (
        <Dropdown
            {...args}
            width={500}
            mutable
            items={items}
            onAdd={(newItem) => {
                setItems([...items, newItem]);
            }}
        />
    );
};

MultiSelect.args = {
    items: Array.from({ length: 100 }, (_, i) => ({
        text: `Item ${i + 1}`,
        key: `item${i + 1}`,
    })),
    disabled: false,
    multiple: true,
};
