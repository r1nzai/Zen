import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import VariantsExample from './examples/Variants';
import SizesExample from './examples/Sizes';
import LoadingExample from './examples/Loading';
import Button from './index';

const meta = preview.meta({
    title: 'Components/Button',
    component: Button,
});

export const Primary = meta.story({
    args: {
        children: 'Button',
        variant: 'default',
        size: 'default',
        onClick: fn(),
    },
});

export const Variants = meta.story({ render: () => <VariantsExample /> });

export const Sizes = meta.story({ render: () => <SizesExample /> });

export const Loading = meta.story({ render: () => <LoadingExample /> });
