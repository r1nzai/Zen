import preview from '../../.storybook/preview';
import AccountsExample from './examples/Accounts';
import Combobox from './index';

const meta = preview.meta({
    title: 'Components/Combobox',
    component: Combobox,
});

export const Accounts = meta.story({ render: () => <AccountsExample /> });
