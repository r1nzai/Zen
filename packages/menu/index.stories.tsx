import preview from '../../.storybook/preview';
import AccountExample from './examples/Account';
import Menu from './index';

const meta = preview.meta({
    title: 'Components/Menu',
    component: Menu,
});

export const Account = meta.story({ render: () => <AccountExample /> });
