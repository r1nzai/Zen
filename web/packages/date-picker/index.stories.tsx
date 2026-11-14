import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RangeExample from './examples/Range';
import InFieldExample from './examples/InField';
import DatePicker from './index';

const meta = preview.meta({
    title: 'Components/DatePicker',
    component: DatePicker,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Range = meta.story({ render: () => <RangeExample /> });

export const InField = meta.story({ render: () => <InFieldExample /> });
