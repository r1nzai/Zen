import { StoryFn, Meta } from '@storybook/react';
import RichTextEditor from './index';

export default {
    component: RichTextEditor,
} as Meta<typeof RichTextEditor>;

const Template: StoryFn<typeof RichTextEditor> = (args) => {
    return (
        <>
            <RichTextEditor />
        </>
    );
};

export const Primary = Template.bind({});

Primary.args = {};
