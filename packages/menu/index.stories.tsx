import preview from '../../.storybook/preview';
import AccountExample from './examples/Account';
import OptionsExample from './examples/Options';
import Menu from './index';

const meta = preview.meta({
    title: 'Components/Menu',
    component: Menu,
});

export const Account = meta.story({ render: () => <AccountExample /> });

export const Options = meta.story({ render: () => <OptionsExample /> });
