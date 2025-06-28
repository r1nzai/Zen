import { Meta, StoryObj } from '@storybook/react-vite';

import { useArgs } from 'storybook/internal/preview-api';
import Toggle from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Toggle',
    component: Toggle,
} as Meta<typeof Toggle>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const Primary: StoryObj<typeof Toggle> = {
    args: {
        checked: false,
    },
    render: (args) => {
        const [, updateArgs] = useArgs();
        return (
            <Toggle
                {...args}
                onChange={(e) => {
                    updateArgs({ checked: e });
                }}
            />
        );
    },
};
