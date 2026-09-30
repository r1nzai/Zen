import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SelectAllExample from './examples/SelectAll';
import Checkbox from './index';

const meta = preview.meta({
    title: 'Components/Checkbox',
    component: Checkbox,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const SelectAll = meta.story({ render: () => <SelectAllExample /> });
