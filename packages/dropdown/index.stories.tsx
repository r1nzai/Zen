import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import SingleSelectExample from './examples/SingleSelect';
import MultiSelectExample from './examples/MultiSelect';
import Dropdown, { DropdownItem } from './index';

const onChange = fn();

const meta = preview.meta({
    title: 'Components/Dropdown',
    component: Dropdown,
    args: {
        items: Array.from({ length: 100 }, (_, i) => ({
            text: `Item ${i + 1}`,
            key: `item${i + 1}`,
        })),
        disabled: false,
        onChange,
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <Dropdown
                {...args}
                onChange={(selected: DropdownItem | DropdownItem[]) => {
                    onChange(selected);
                    updateArgs({ selected });
                }}
            />
        );
    },
});

export const SingleSelect = meta.story({ render: () => <SingleSelectExample /> });

export const MultiSelect = meta.story({ render: () => <MultiSelectExample /> });
