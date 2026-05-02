import { useArgs } from 'storybook/internal/preview-api';
import { Meta, StoryObj } from '@storybook/react-vite';

import Badge from '../badge';
import Button from '../button';
import Input from '../input';
import Textarea from '../textarea';
import Toggle from '../toggle';
import Popover from './index';

export default {
    title: 'Popover',
    component: Popover,
} as Meta<typeof Popover>;

// ─── Default ────────────────────────────────────────────────────────────────

export const Default: StoryObj<typeof Popover> = {
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
};

// ─── Hover tooltip triggered by a Badge ─────────────────────────────────────

export const HoverBadgeTooltip: StoryObj<typeof Popover> = {
    args: {
        trigger: 'hover',
        triggerType: 'auto',
        role: 'tooltip',
        content: (
            <div className="p-3 text-sm">
                <p className="font-medium">Beta feature</p>
                <p className="text-muted-foreground mt-0.5">This feature is still in preview and may change.</p>
            </div>
        ),
        children: <Badge variant="secondary">Beta</Badge>,
    },
    render: (args) => (
        <div className="flex h-48 items-center justify-center">
            <Popover {...args} />
        </div>
    ),
};

// ─── User profile card ───────────────────────────────────────────────────────

export const UserProfileCard: StoryObj<typeof Popover> = {
    args: {
        trigger: 'click',
        triggerType: 'auto',
        role: 'dialog',
        content: (
            <div className="flex w-64 flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold">
                        AJ
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Alex Johnson</p>
                        <p className="text-muted-foreground text-xs">alex@example.com</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="default">Admin</Badge>
                    <Badge variant="outline">Pro</Badge>
                </div>
                <div className="border-border flex flex-col gap-2 border-t pt-3">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                        View profile
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                        Settings
                    </Button>
                    <Button variant="destructive" size="sm" className="w-full justify-start">
                        Sign out
                    </Button>
                </div>
            </div>
        ),
        children: (
            <div className="bg-primary text-primary-foreground flex size-9 cursor-pointer items-center justify-center rounded-full text-sm font-bold">
                AJ
            </div>
        ),
    },
    render: (args) => (
        <div className="flex h-72 items-center justify-center">
            <Popover {...args} />
        </div>
    ),
};

// ─── Feedback form with Input + Textarea + Buttons ───────────────────────────

export const FeedbackForm: StoryObj<typeof Popover> = {
    args: {
        trigger: 'click',
        triggerType: 'auto',
        role: 'dialog',
        content: (
            <div className="flex w-72 flex-col gap-3 p-4">
                <p className="text-sm font-semibold">Send feedback</p>
                <Input placeholder="Subject" />
                <Textarea placeholder="Describe your feedback…" className="h-24 resize-none" />
                <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                        Cancel
                    </Button>
                    <Button size="sm">Submit</Button>
                </div>
            </div>
        ),
        children: <Button variant="outline">Give feedback</Button>,
    },
    render: (args) => (
        <div className="flex h-80 items-center justify-center">
            <Popover {...args} />
        </div>
    ),
};

// ─── Notification badge trigger ──────────────────────────────────────────────

export const NotificationsBadgeTrigger: StoryObj<typeof Popover> = {
    args: {
        trigger: 'click',
        triggerType: 'auto',
        role: 'dialog',
        content: (
            <div className="flex w-64 flex-col p-3">
                <p className="text-muted-foreground px-2 pb-2 text-xs font-semibold tracking-wide uppercase">
                    Notifications
                </p>
                <div className="flex flex-col gap-1">
                    {[
                        { label: 'Build succeeded', variant: 'default' as const, time: '2m ago' },
                        { label: 'New comment on PR #42', variant: 'secondary' as const, time: '15m ago' },
                        { label: 'Deploy failed', variant: 'destructive' as const, time: '1h ago' },
                    ].map(({ label, variant, time }) => (
                        <div
                            key={label}
                            className="hover:bg-accent flex items-center justify-between rounded px-2 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <Badge variant={variant} className="shrink-0">
                                    {variant === 'destructive' ? 'Error' : variant === 'default' ? 'OK' : 'Info'}
                                </Badge>
                                <span className="text-sm">{label}</span>
                            </div>
                            <span className="text-muted-foreground text-xs">{time}</span>
                        </div>
                    ))}
                </div>
                <div className="border-border mt-2 border-t pt-2">
                    <Button variant="ghost" size="sm" className="w-full">
                        View all
                    </Button>
                </div>
            </div>
        ),
        children: <Badge variant="destructive">3 alerts</Badge>,
    },
    render: (args) => (
        <div className="flex h-72 items-center justify-center">
            <Popover {...args} />
        </div>
    ),
};

// ─── Settings panel with Toggles ─────────────────────────────────────────────

export const SettingsPanel: StoryObj<typeof Popover> = {
    args: {
        trigger: 'click',
        triggerType: 'auto',
        role: 'dialog',
        children: <Button variant="outline">Preferences</Button>,
    },
    render: (args) => {
        const [{ notifications, darkMode, autoSave }, updateArgs] = useArgs<{
            notifications: boolean;
            darkMode: boolean;
            autoSave: boolean;
        }>();

        return (
            <div className="flex h-72 items-center justify-center">
                <Popover
                    {...args}
                    content={
                        <div className="flex w-60 flex-col gap-4 p-4">
                            <p className="text-sm font-semibold">Preferences</p>
                            {(
                                [
                                    { key: 'notifications', label: 'Notifications' },
                                    { key: 'darkMode', label: 'Dark mode' },
                                    { key: 'autoSave', label: 'Auto-save' },
                                ] as const
                            ).map(({ key, label }) => (
                                <div key={key} className="flex items-center justify-between py-1">
                                    <span className="text-sm">{label}</span>
                                    <Toggle
                                        checked={
                                            key === 'notifications'
                                                ? notifications
                                                : key === 'darkMode'
                                                  ? darkMode
                                                  : autoSave
                                        }
                                        onChange={(val) => updateArgs({ [key]: val })}
                                    />
                                </div>
                            ))}
                        </div>
                    }
                />
            </div>
        );
    },
};

// ─── Manual control ──────────────────────────────────────────────────────────

export const ManualControl: StoryObj<typeof Popover> = {
    args: {
        trigger: 'click',
        triggerType: 'manual',
        role: 'dialog',
        show: false,
        content: (
            <div className="p-3 text-sm">
                <p className="font-medium">Manually controlled</p>
                <p className="text-muted-foreground mt-1">
                    Toggle the <strong>show</strong> control in the panel below.
                </p>
            </div>
        ),
        children: <Button>Toggle popover</Button>,
    },
    render: (args) => {
        const [{ show }, updateArgs] = useArgs();
        return (
            <div className="flex h-48 items-center justify-center">
                <Popover {...args} show={show} setShow={(val) => updateArgs({ show: val })} />
            </div>
        );
    },
};
