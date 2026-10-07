import preview from '../../.storybook/preview';
import AccentExample from './examples/Accent';
import DefaultExample from './examples/Default';
import InlineExample from './examples/Inline';
import SwatchesExample from './examples/Swatches';
import ColorPicker from './index';

const meta = preview.meta({
    title: 'Components/ColorPicker',
    component: ColorPicker,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Swatches = meta.story({ render: () => <SwatchesExample /> });

export const Inline = meta.story({ render: () => <InlineExample /> });

export const Accent = meta.story({ render: () => <AccentExample /> });
