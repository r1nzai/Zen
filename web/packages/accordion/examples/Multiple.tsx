import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Toggle } from '@rinzai/zen';

/** `multiple`: each section opens and closes on its own. */
export default function Multiple() {
    return (
        <Accordion multiple defaultValue={['alerts']} className="w-full max-w-sm">
            <AccordionItem value="alerts">
                <AccordionTrigger>Alerts</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3">
                    <label className="flex items-center justify-between font-normal">
                        Over budget
                        <Toggle defaultChecked />
                    </label>
                    <label className="flex items-center justify-between font-normal">
                        Large payments
                        <Toggle />
                    </label>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="export">
                <AccordionTrigger>Export</AccordionTrigger>
                <AccordionContent>Download every entry as a CSV file, one row each.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="danger">
                <AccordionTrigger>Delete data</AccordionTrigger>
                <AccordionContent>Removes every entry and budget. This can’t be undone.</AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
