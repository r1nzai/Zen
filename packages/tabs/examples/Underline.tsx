import { Tab, TabList, TabPanel, Tabs } from '@rinzai/zen';

export default function Underline() {
    return (
        <Tabs defaultValue="month" className="w-96">
            <TabList>
                <Tab value="month">Month</Tab>
                <Tab value="year">Year</Tab>
                <Tab value="all">All time</Tab>
            </TabList>
            <TabPanel value="month" className="text-muted-foreground text-sm">
                Spending for September.
            </TabPanel>
            <TabPanel value="year" className="text-muted-foreground text-sm">
                Spending for 2026 so far.
            </TabPanel>
            <TabPanel value="all" className="text-muted-foreground text-sm">
                Everything since you started.
            </TabPanel>
        </Tabs>
    );
}
