import { Meter, Tab, TabList, TabPanel, Tabs } from '@rinzai/zen';

const BUDGETS = [
    { name: 'Groceries', spent: 412, limit: 500 },
    { name: 'Eating out', spent: 188, limit: 150 },
    { name: 'Transport', spent: 64, limit: 120 },
];

/** The last panel slides out as the picked one slides in, and the space between eases to fit. */
export default function Panels() {
    return (
        <Tabs defaultValue="summary" className="w-full max-w-md">
            <TabList>
                <Tab value="summary">Summary</Tab>
                <Tab value="budgets">Budgets</Tab>
                <Tab value="notes">Notes</Tab>
            </TabList>
            <TabPanel value="summary" className="text-sm">
                <p className="text-2xl font-semibold tabular-nums">$1,845.11</p>
                <p className="text-muted-foreground">Spent this month, $210 less than last.</p>
            </TabPanel>
            <TabPanel value="budgets" className="flex flex-col gap-4 text-sm">
                {BUDGETS.map((b) => (
                    <Meter
                        key={b.name}
                        label={b.name}
                        value={b.spent}
                        max={b.limit}
                        detail={`$${b.spent} / $${b.limit}`}
                    />
                ))}
            </TabPanel>
            <TabPanel value="notes" className="text-muted-foreground text-sm">
                Rent goes out on the 5th.
            </TabPanel>
        </Tabs>
    );
}
