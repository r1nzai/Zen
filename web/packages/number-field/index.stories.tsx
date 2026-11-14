import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import FormatsExample from './examples/Formats';
import NumberField from './index';

const meta = preview.meta({
    title: 'Components/NumberField',
    component: NumberField,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Formats = meta.story({ render: () => <FormatsExample /> });
