import { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';

import Badge from '@zen/badge';
import Collapse from './index';
// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
    title: 'Collapse',
    component: Collapse,
    // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
} as Meta<typeof Collapse>;
const items = Array.from({ length: 100 }, (_, i) => `testItem${i}`);
// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
export const Primary: StoryObj<typeof Collapse> = {
    args: {
        items,
    },
    render: (args) => {
        const parentRef = useRef<HTMLDivElement>(null);
        return (
            <div ref={parentRef} className="flex w-full items-center gap-1">
                <Collapse items={args.items} parentRef={parentRef} badgeStyles="h-6">
                    {(item, index) => (
                        <Badge key={index} className="h-6" variant={'secondary'}>
                            {item}
                        </Badge>
                    )}
                </Collapse>
            </div>
        );
    },
};
