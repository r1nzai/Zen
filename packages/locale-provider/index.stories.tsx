import preview from '../../.storybook/preview';
import FrenchExample from './examples/French';
import LocaleProvider from './index';

const meta = preview.meta({
    title: 'Components/LocaleProvider',
    component: LocaleProvider,
});

export const French = meta.story({ render: () => <FrenchExample /> });
