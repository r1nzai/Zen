import preview from '../../.storybook/preview';
import FrenchExample from './examples/French';
import RightToLeftExample from './examples/RightToLeft';
import LocaleProvider from './index';

const meta = preview.meta({
    title: 'Components/LocaleProvider',
    component: LocaleProvider,
});

export const French = meta.story({ render: () => <FrenchExample /> });
export const RightToLeft = meta.story({ render: () => <RightToLeftExample /> });
