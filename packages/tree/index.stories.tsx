import preview from '../../.storybook/preview';
import PlannerExample from './examples/Planner';
import { TreeRow } from './index';

const meta = preview.meta({
    title: 'Components/TreeTable',
    component: TreeRow,
    parameters: { layout: 'padded' },
});

export const Planner = meta.story({ render: () => <PlannerExample /> });
