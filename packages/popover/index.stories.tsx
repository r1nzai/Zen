import preview from '../../.storybook/preview';
import ControlledExample from './examples/Controlled';
import FeedbackFormExample from './examples/FeedbackForm';
import ProfileCardExample from './examples/ProfileCard';
import SettingsExample from './examples/Settings';
import Popover from './index';

const meta = preview.meta({
    title: 'Components/Popover',
    component: Popover,
});

export const ProfileCard = meta.story({ render: () => <ProfileCardExample /> });

export const FeedbackForm = meta.story({ render: () => <FeedbackFormExample /> });

export const Settings = meta.story({ render: () => <SettingsExample /> });

export const Controlled = meta.story({ render: () => <ControlledExample /> });
