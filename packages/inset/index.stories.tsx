import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Inset from './index';

const meta = preview.meta({
    title: 'Components/Inset',
    component: Inset,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
