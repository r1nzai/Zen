import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Tooltip from './index';

const meta = preview.meta({
    title: 'Components/Tooltip',
    component: Tooltip,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
