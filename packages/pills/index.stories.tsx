import preview from '../../.storybook/preview';
import NavigationExample from './examples/Navigation';
import Pills from './index';

const meta = preview.meta({
    title: 'Components/Pills',
    component: Pills,
});

export const Navigation = meta.story({ render: () => <NavigationExample /> });
