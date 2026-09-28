import preview from '../../.storybook/preview';
import LoadingCardExample from './examples/LoadingCard';
import WithSpinnerExample from './examples/WithSpinner';
import Skeleton from './index';

const meta = preview.meta({
    title: 'Components/Skeleton',
    component: Skeleton,
});

export const LoadingCard = meta.story({ render: () => <LoadingCardExample /> });

export const WithSpinner = meta.story({ render: () => <WithSpinnerExample /> });
