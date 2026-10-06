import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Trend from './index';

const meta = preview.meta({
    title: 'Components/Trend',
    component: Trend,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
