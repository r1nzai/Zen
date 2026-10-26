import preview from '../../.storybook/preview';
import AccountExample from './examples/Account';
import BarExample from './examples/Bar';
import OptionsExample from './examples/Options';
import SheetExample from './examples/Sheet';
import Menu from './index';

const meta = preview.meta({
    title: 'Components/Menu',
    component: Menu,
});

export const Account = meta.story({ render: () => <AccountExample /> });

export const Options = meta.story({ render: () => <OptionsExample /> });
export const Bar = meta.story({ render: () => <BarExample /> });
export const Sheet = meta.story({ render: () => <SheetExample /> });
