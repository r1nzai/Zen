import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import CalendarHeatmap from './index';

const meta = preview.meta({
    title: 'Components/CalendarHeatmap',
    component: CalendarHeatmap,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
