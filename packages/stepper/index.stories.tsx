import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Stepper from './index';

const meta = preview.meta({
    title: 'Components/Stepper',
    component: Stepper,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
