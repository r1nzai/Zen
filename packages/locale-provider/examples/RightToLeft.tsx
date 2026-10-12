import { Calendar, LocaleProvider, Pagination, Slider, Tab, TabList, Tabs } from '@rinzai/zen';
import { useState } from 'react';

/**
 * Right to left: set `dir="rtl"` on the page (or any part of it). Layout,
 * arrow keys and arrows follow; LocaleProvider gives the locale and words.
 */
export default function RightToLeft() {
    const [page, setPage] = useState(2);
    return (
        <div dir="rtl" className="flex w-80 flex-col gap-5">
            <LocaleProvider locale="ar-EG" messages={{ previousPage: 'الصفحة السابقة', nextPage: 'الصفحة التالية' }}>
                <Tabs defaultValue="month">
                    <TabList>
                        <Tab value="month">الشهر</Tab>
                        <Tab value="year">السنة</Tab>
                    </TabList>
                </Tabs>
                <Calendar defaultValue="2026-10-12" />
                <Slider aria-label="الميزانية" defaultValue={30} />
                <Pagination page={page} count={5} onPageChange={setPage} />
            </LocaleProvider>
        </div>
    );
}
