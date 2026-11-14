import { render, screen } from '@testing-library/react';

import Timeline, { TimelineItem } from './index';

describe('Timeline', () => {
    it('lists events in order with their time and details', () => {
        render(
            <Timeline>
                <TimelineItem title="Paid" time="Today" active>
                    $1,850
                </TimelineItem>
                <TimelineItem title="Created" />
            </Timeline>,
        );
        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent('PaidToday$1,850');
        expect(items[1]).toHaveTextContent('Created');
    });
});
