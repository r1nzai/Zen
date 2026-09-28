import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Header from './index';

const meta = preview.meta({
    title: 'Components/Header',
    component: Header,
    parameters: { layout: 'padded' },
});

export const Default = meta.story({ render: () => <DefaultExample /> });
