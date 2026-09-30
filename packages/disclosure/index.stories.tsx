import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Disclosure from './index';

const meta = preview.meta({
    title: 'Components/Disclosure',
    component: Disclosure,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
