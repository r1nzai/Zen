import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Sparkline from './index';

const meta = preview.meta({
    title: 'Components/Sparkline',
    component: Sparkline,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
