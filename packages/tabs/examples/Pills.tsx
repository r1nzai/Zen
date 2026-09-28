import { Tab, TabList, TabPanel, Tabs } from '@rinzai/zen';

export default function Pills() {
    return (
        <Tabs defaultValue="all" className="w-96">
            <TabList variant="pills">
                <Tab value="all">All</Tab>
                <Tab value="expenses">Expenses</Tab>
                <Tab value="income">Income</Tab>
            </TabList>
            <TabPanel value="all" className="text-muted-foreground text-sm">
                Every entry this month.
            </TabPanel>
            <TabPanel value="expenses" className="text-muted-foreground text-sm">
                Money going out.
            </TabPanel>
            <TabPanel value="income" className="text-muted-foreground text-sm">
                Money coming in.
            </TabPanel>
        </Tabs>
    );
}
