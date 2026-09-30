import { Chart, ChartLine } from '@rinzai/zen';

const DATA = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
    day,
    web: [420, 480, 510, 470, 560, 690, 640][i],
    ios: [310, 330, 360, 390, 380, 450, 470][i],
    android: [220, 260, 250, 300, 330, 310, 360][i],
}));

/** Several series in the chart palette, in the order they're written; the legend appears for two or more. */
export default function Lines() {
    return (
        <Chart data={DATA} x="day" label="Sessions by platform" height={220} className="w-full max-w-2xl">
            <ChartLine dataKey="web" label="Web" />
            <ChartLine dataKey="ios" label="iOS" />
            <ChartLine dataKey="android" label="Android" />
        </Chart>
    );
}
