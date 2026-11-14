import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Chip from './index';

const meta = preview.meta({
    title: 'Components/Chip',
    component: Chip,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
