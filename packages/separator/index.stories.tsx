import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Separator from './index';

const meta = preview.meta({
    title: 'Components/Separator',
    component: Separator,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
