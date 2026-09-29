import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Segmented, { SegmentedItem } from './index';

const meta = preview.meta({
    title: 'Components/Segmented',
    component: Segmented,
});

export const Primary = meta.story({
    args: {
        label: 'Glow',
        value: 'soft',
        onChange: fn(),
        children: [
            <SegmentedItem key="off" value="off">
                Off
            </SegmentedItem>,
            <SegmentedItem key="soft" value="soft">
                Soft
            </SegmentedItem>,
            <SegmentedItem key="bright" value="bright">
                Bright
            </SegmentedItem>,
        ],
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
