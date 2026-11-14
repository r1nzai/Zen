import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Collapse from './index';

const meta = preview.meta({
    title: 'Components/Collapse',
    component: Collapse,
    // Collapse measures its parent's width, so give it the full canvas
    parameters: { layout: 'padded' },
});

export const Default = meta.story({ render: () => <DefaultExample /> });
