import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Card, CardHeader, CardTitle } from '@rinzai/zen';

const QUESTIONS = [
    {
        q: 'How are other currencies converted?',
        a: 'At the day’s rate when you save the entry. The original amount and rate are kept with it, so the conversion never changes later.',
    },
    {
        q: 'Can I split one payment across categories?',
        a: 'Yes: add it once, then split it. Each part counts towards its own category’s budget.',
    },
    {
        q: 'What happens to a budget I go over?',
        a: 'Nothing is blocked. The bar turns red, and the overspend is shown in the month’s summary.',
    },
];

/** Questions and answers: opening one closes the last. */
export default function Default() {
    return (
        <Card className="w-full max-w-md gap-2">
            <CardHeader>
                <CardTitle>Questions</CardTitle>
            </CardHeader>
            <Accordion defaultValue="0">
                {QUESTIONS.map(({ q, a }, i) => (
                    <AccordionItem key={q} value={String(i)}>
                        <AccordionTrigger>{q}</AccordionTrigger>
                        <AccordionContent>{a}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </Card>
    );
}
