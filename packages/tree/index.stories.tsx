import preview from '../../.storybook/preview';
import BasicExample from './examples/Basic';
import PlannerExample from './examples/Planner';
import { TreeRow } from './index';

const meta = preview.meta({
    title: 'Components/TreeTable',
    component: TreeRow,
    parameters: { layout: 'padded' },
});

export const Basic = meta.story({ render: () => <BasicExample /> });

export const Planner = meta.story({ render: () => <PlannerExample /> });
