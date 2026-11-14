import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SplitExample from './examples/Split';
import ButtonGroup from './index';

const meta = preview.meta({
    title: 'Components/ButtonGroup',
    component: ButtonGroup,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Split = meta.story({ render: () => <SplitExample /> });
