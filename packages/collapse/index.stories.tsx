import { Meta, StoryFn } from '@storybook/react';
import React, { useRef } from 'react';

import Collapse from './index';
import Badge from '@zen/badge';
import Container from '@zen/container';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Collapse',
    component: Collapse,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Collapse>;
const items = Array.from({ length: 100 }, (_, i) => `testItem${i}`);
// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof Collapse> = (args) => {
    const ref = useRef<HTMLDivElement>(null);
    return (
        <Container ref={ref} className="flex w-full items-center gap-1">
            <Collapse items={items} parentRef={ref} badgeStyles="h-6">
                {(item, index) => (
                    <Badge key={index} className="h-6" variant={'secondary'}>
                        {item}
                    </Badge>
                )}
            </Collapse>
        </Container>
    );
};

export const Primary = Template.bind({});
