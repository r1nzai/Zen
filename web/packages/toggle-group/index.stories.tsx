import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import SingleExample from './examples/Single';
import ToggleGroup from './index';

const meta = preview.meta({
    title: 'Components/ToggleGroup',
    component: ToggleGroup,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Single = meta.story({ render: () => <SingleExample /> });
