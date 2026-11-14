import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import CustomOptionsExample from './examples/CustomOptions';
import Select from './index';

const meta = preview.meta({
    title: 'Components/Select',
    component: Select,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const CustomOptions = meta.story({ render: () => <CustomOptionsExample /> });
