import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Field from './index';

const meta = preview.meta({
    title: 'Components/Field',
    component: Field,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
