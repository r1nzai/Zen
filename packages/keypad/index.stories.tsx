import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import Keypad from './index';

const meta = preview.meta({
    title: 'Components/Keypad',
    component: Keypad,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
