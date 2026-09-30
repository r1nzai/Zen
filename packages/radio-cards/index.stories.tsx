import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import RadioCards from './index';

const meta = preview.meta({
    title: 'Components/RadioCards',
    component: RadioCards,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
