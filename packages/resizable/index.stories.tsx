import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import ResizablePanelGroup from './index';

const meta = preview.meta({
    title: 'Components/Resizable',
    component: ResizablePanelGroup,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
