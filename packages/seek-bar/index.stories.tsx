import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SeekBar from './index';

const meta = preview.meta({
    title: 'Components/SeekBar',
    component: SeekBar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
