import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Kbd from './index';

const meta = preview.meta({
    title: 'Components/Kbd',
    component: Kbd,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
