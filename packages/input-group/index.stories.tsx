import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import WithButtonExample from './examples/WithButton';
import InputGroup from './index';

const meta = preview.meta({
    title: 'Components/InputGroup',
    component: InputGroup,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const WithButton = meta.story({ render: () => <WithButtonExample /> });
