import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import LoadingExample from './examples/Loading';
import Spinner from './index';

const meta = preview.meta({
    title: 'Components/Spinner',
    component: Spinner,
});

export const Default = meta.story({ args: {} });

export const Sizes = meta.story({ render: () => <DefaultExample /> });

export const Loading = meta.story({ render: () => <LoadingExample /> });
