import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RangeExample from './examples/Range';
import LimitsExample from './examples/Limits';
import Calendar from './index';

const meta = preview.meta({
    title: 'Components/Calendar',
    component: Calendar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Range = meta.story({ render: () => <RangeExample /> });

export const Limits = meta.story({ render: () => <LimitsExample /> });
