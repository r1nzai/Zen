import preview from '../../.storybook/preview';
import TooltipExample from './examples/Tooltip';
import ProfileCardExample from './examples/ProfileCard';
import FeedbackFormExample from './examples/FeedbackForm';
import SettingsExample from './examples/Settings';
import ControlledExample from './examples/Controlled';
import Button from '../button';
import Popover from './index';

const meta = preview.meta({
    title: 'Components/Popover',
    component: Popover,
});

// ─── Default ────────────────────────────────────────────────────────────────

export const Default = meta.story({
    args: {
        trigger: 'click',
        triggerType: 'auto',
        role: 'tooltip',
        content: (
            <div className="p-3 text-sm">
                <p>This is a simple popover.</p>
            </div>
        ),
        children: <Button variant="outline">Click me</Button>,
    },
    render: (args) => (
        <div className="flex h-48 items-center justify-center">
            <Popover {...args} />
        </div>
    ),
});

export const Tooltip = meta.story({ render: () => <TooltipExample /> });

export const ProfileCard = meta.story({ render: () => <ProfileCardExample /> });

export const FeedbackForm = meta.story({ render: () => <FeedbackFormExample /> });

export const Settings = meta.story({ render: () => <SettingsExample /> });

export const Controlled = meta.story({ render: () => <ControlledExample /> });
