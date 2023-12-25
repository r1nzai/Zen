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
        <Container ref={ref} className="flex w-full gap-1">
            <Collapse items={items} parentRef={ref}>
                {(renderItems) => (
                    <>
                        {renderItems.visible.map((item) => (
                            <Badge key={item}>{item}</Badge>
                        ))}
                        {renderItems.hidden.length > 0 && <Badge>+{renderItems.hidden.length}</Badge>}
                    </>
                )}
            </Collapse>
        </Container>
    );
};

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/react/writing-stories/args
Primary.args = {
    children: 'Text Component',
};
