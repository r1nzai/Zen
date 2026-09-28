import { fn } from 'storybook/test';

import preview from '../../.storybook/preview';
import ToastProvider from '../toast';
import DefaultExample from './examples/Default';
import ActionsMenu from './index';

const meta = preview.meta({
    title: 'Components/ActionsMenu',
    component: ActionsMenu,
});

export const Primary = meta.story({
    args: {
        label: 'Goal actions',
        actions: [
            { label: 'Edit', onClick: fn() },
            { label: 'Duplicate', onClick: fn() },
            { label: 'Delete', onClick: fn(), destructive: true },
        ],
    },
});

// Its actions show toasts, so it needs a provider.
export const Default = meta.story({
    render: () => (
        <ToastProvider>
            <DefaultExample />
        </ToastProvider>
    ),
});
