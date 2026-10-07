import preview from '../../.storybook/preview';
import OverlayExample from './examples/Overlay';
import SnappingExample from './examples/Snapping';
import { Canvas } from './index';

const meta = preview.meta({
    title: 'Components/Canvas',
    component: Canvas,
});

export const Overlay = meta.story({ render: () => <OverlayExample /> });

export const Snapping = meta.story({ render: () => <SnappingExample /> });
