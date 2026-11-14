import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RangeExample from './examples/Range';
import MonthPicker from './index';

const meta = preview.meta({
    title: 'Components/MonthPicker',
    component: MonthPicker,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Range = meta.story({ render: () => <RangeExample /> });
