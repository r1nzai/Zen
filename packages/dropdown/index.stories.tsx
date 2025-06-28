import { useArgs } from 'storybook/preview-api';
import { Meta, StoryObj } from '@storybook/react-vite';
import Dropdown from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Dropdown',
    component: Dropdown,
} as Meta<typeof Dropdown>;

export const SingleSelect: StoryObj<typeof Dropdown> = {
    args: {
        items: Array.from({ length: 100 }, (_, i) => ({
            text: `Item ${i + 1}`,
            key: `item${i + 1}`,
        })),
        className: 'w-64',
        disabled: false,
        selected: { text: 'Item 1', key: 'item1' },
    },
    render: (args) => {
        const [, updateArgs] = useArgs();
        return (
            <Dropdown
                {...args}
                onChange={(e) => {
                    updateArgs({ selected: e });
                }}
            />
        );
    },
};
export const MultiSelect: StoryObj<typeof Dropdown> = {
    args: {
        items: Array.from({ length: 100 }, (_, i) => ({
            text: `Item ${i + 1}`,
            key: `item${i + 1}`,
        })),
        disabled: false,
        multiple: true,
        mutable: true,
        className: 'w-[500px]',
        selected: [
            {
                text: 'Item 1',
                key: 'item1',
            },
            {
                text: 'Item 4',
                key: 'item4',
            },
            {
                text: 'Item 5',
                key: 'item5',
            },
            {
                text: 'Item 3',
                key: 'item3',
            },
            {
                text: 'Item 6',
                key: 'item6',
            },
            {
                text: 'Item 2',
                key: 'item2',
            },
        ],
    },
    render: (args) => {
        const [, updateArgs] = useArgs();
        return (
            <Dropdown
                {...args}
                onChange={(e) => {
                    updateArgs({ selected: e });
                }}
                onAdd={(newItem) => {
                    updateArgs({ items: [...args.items, newItem] });
                }}
            />
        );
    },
};
