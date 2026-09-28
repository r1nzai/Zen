import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Segmented from './index';

const meta = preview.meta({
    title: 'Components/Segmented',
    component: Segmented,
});

export const Primary = meta.story({
    args: {
        label: 'Glow',
        value: 'soft',
        options: [
            { value: 'off', label: 'Off' },
            { value: 'soft', label: 'Soft' },
            { value: 'bright', label: 'Bright' },
        ],
        onChange: fn(),
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <Segmented
                {...args}
                onChange={(value) => {
                    args.onChange(value);
                    updateArgs({ value });
                }}
            />
        );
    },
});

export const Example = meta.story({ render: () => <DefaultExample /> });
