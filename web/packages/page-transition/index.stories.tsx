import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import PageTransition from './index';

const meta = preview.meta({
    title: 'Components/PageTransition',
    component: PageTransition,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
