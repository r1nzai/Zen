import preview from '../../.storybook/preview';
import SaveExample from './examples/Save';
import StatusPill from './index';

const meta = preview.meta({
    title: 'Components/StatusPill',
    component: StatusPill,
});

export const Save = meta.story({ render: () => <SaveExample /> });
