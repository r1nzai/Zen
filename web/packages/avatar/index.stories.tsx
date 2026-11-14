import preview from '../../.storybook/preview';
import DefaultExample from './examples/Default';
import UploadExample from './examples/Upload';
import Avatar from './index';

const meta = preview.meta({
    title: 'Components/Avatar',
    component: Avatar,
});

export const Default = meta.story({ render: () => <DefaultExample /> });

export const Upload = meta.story({ render: () => <UploadExample /> });
