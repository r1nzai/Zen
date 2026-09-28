import { useArgs } from 'storybook/preview-api';
import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Toggle from './index';

const meta = preview.meta({
    title: 'Components/Toggle',
    component: Toggle,
});

export const Primary = meta.story({
    args: {
        checked: false,
        onChange: fn(),
    },
    render: function Render(args) {
        const [, updateArgs] = useArgs();
        return (
            <Toggle
                {...args}
                onChange={(checked) => {
                    args.onChange?.(checked);
                    updateArgs({ checked });
                }}
            />
        );
    },
});

export const Example = meta.story({ render: () => <DefaultExample /> });
