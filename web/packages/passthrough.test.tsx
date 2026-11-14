import { render } from '@testing-library/react';
import { cloneElement, createRef, ReactElement, Ref } from 'react';
import { describe, expect, it } from 'vite-plus/test';

import { Avatar, CalendarHeatmap, Chart, ChartBar, Collapse, Field, Input, Keypad, LoadMore } from './index';
import { PageHeader, ProgressRing, RadioCard, RadioCards, RadioGroup, Radio, RangeSlider, Segmented } from './index';
import { SegmentedItem, Skeleton, Spinner, TableOfContents, Calendar, RepeatPicker, EditableCell } from './index';

/** Each renders `data-probe` and an id on its outer element, and hands that element to a ref. */
const CASES: [string, (ref: Ref<never>) => ReactElement][] = [
    ['Avatar', (ref) => <Avatar name="Ada" ref={ref} />],
    ['CalendarHeatmap', (ref) => <CalendarHeatmap month="2026-09" values={{}} locale="en-US" ref={ref} />],
    [
        'Chart',
        (ref) => (
            <Chart data={[{ m: 'Sep', v: 1 }]} x="m" label="Chart" ref={ref}>
                <ChartBar dataKey="v" label="V" />
            </Chart>
        ),
    ],
    [
        'Collapse',
        (ref) => (
            <Collapse items={['a']} ref={ref}>
                {(t) => <span>{t}</span>}
            </Collapse>
        ),
    ],
    [
        'Field',
        (ref) => (
            <Field label="Name" ref={ref}>
                <Input />
            </Field>
        ),
    ],
    ['Keypad', (ref) => <Keypad ref={ref} />],
    ['LoadMore', (ref) => <LoadMore onLoadMore={() => {}} hasMore ref={ref} />],
    ['PageHeader', (ref) => <PageHeader title="Budget" ref={ref} />],
    ['ProgressRing', (ref) => <ProgressRing value={0.5} label="Goal" ref={ref} />],
    [
        'RadioCards',
        (ref) => (
            <RadioCards label="Plan" ref={ref}>
                <RadioCard value="a">A</RadioCard>
            </RadioCards>
        ),
    ],
    [
        'RadioGroup',
        (ref) => (
            <RadioGroup aria-label="Plan" ref={ref}>
                <Radio value="a">A</Radio>
            </RadioGroup>
        ),
    ],
    ['RangeSlider', (ref) => <RangeSlider label="Price" ref={ref} />],
    [
        'Segmented',
        (ref) => (
            <Segmented label="View" ref={ref}>
                <SegmentedItem value="a">A</SegmentedItem>
            </Segmented>
        ),
    ],
    ['Skeleton', (ref) => <Skeleton ref={ref} />],
    ['Spinner', (ref) => <Spinner ref={ref} />],
    ['TableOfContents', (ref) => <TableOfContents items={[{ id: 'a', label: 'A' }]} ref={ref} />],
    ['Calendar', (ref) => <Calendar locale="en-US" ref={ref} />],
    ['RepeatPicker', (ref) => <RepeatPicker locale="en-US" ref={ref} />],
    [
        'EditableCell',
        (ref) => (
            <EditableCell editor={() => null} ref={ref}>
                1
            </EditableCell>
        ),
    ],
];

describe('other props reach the element', () => {
    it.each(CASES)('%s', (_, make) => {
        const ref = createRef<HTMLElement>();
        const element = make(ref as Ref<never>);
        const { container } = render(cloneElement(element, { id: 'probe', 'data-probe': '' } as object));
        const probe = container.querySelector('[data-probe]');
        expect(probe).not.toBeNull();
        expect(probe).toHaveAttribute('id', 'probe');
        expect(ref.current).toBe(probe);
    });
});
