import preview from '../../.storybook/preview';
import DashboardExample from './examples/Dashboard';
import DesignerExample from './examples/Designer';
import NotesExample from './examples/Notes';
import SnappingExample from './examples/Snapping';
import { Canvas } from './index';

const meta = preview.meta({
    title: 'Components/Canvas',
    component: Canvas,
});

export const Designer = meta.story({ render: () => <DesignerExample /> });

export const Dashboard = meta.story({ render: () => <DashboardExample /> });

export const Notes = meta.story({ render: () => <NotesExample /> });

export const Snapping = meta.story({ render: () => <SnappingExample /> });
