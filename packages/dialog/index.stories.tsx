import preview from '../../.storybook/preview';
import FormExample from './examples/Form';
import ConfirmExample from './examples/Confirm';
import Dialog from './index';

const meta = preview.meta({
    title: 'Components/Dialog',
    component: Dialog,
    args: { open: false, title: 'Rename category' },
});

export const Form = meta.story({ render: () => <FormExample /> });

export const Confirm = meta.story({ render: () => <ConfirmExample /> });
