import preview from '../../.storybook/preview';
import BesideExample from './examples/Beside';
import DefaultExample from './examples/Default';
import Tooltip from './index';

const meta = preview.meta({
    title: 'Components/Tooltip',
    component: Tooltip,
});

export const Default = meta.story({ render: () => <DefaultExample /> });
export const Beside = meta.story({ render: () => <BesideExample /> });
