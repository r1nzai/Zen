import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import StatsExample from './examples/Stats';
import Separator from './index';

const meta = preview.meta({
    title: 'Components/Separator',
    component: Separator,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Stats = meta.story({ render: () => <StatsExample /> });
