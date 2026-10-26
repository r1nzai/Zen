import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import TimesBelowExample from './examples/TimesBelow';
import SeekBar from './index';

const meta = preview.meta({
    title: 'Components/SeekBar',
    component: SeekBar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const TimesBelow = meta.story({ render: () => <TimesBelowExample /> });
