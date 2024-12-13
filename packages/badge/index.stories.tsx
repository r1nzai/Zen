import { Meta, StoryObj } from '@storybook/react';

import Badge from './index';

export default {
    title: 'Badge',
    component: Badge,
} as Meta<typeof Badge>;

export const Primary: StoryObj<typeof Badge> = {
    args: {
        children: 'Text Component',
    },
    render: (args) => <Badge {...args} />,
};
