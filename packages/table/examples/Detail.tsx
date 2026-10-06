import {
    Button,
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
} from '@rinzai/zen';
import { startTransition, useState, ViewTransition } from 'react';

const ENTRIES = [
    {
        id: 'shop',
        label: 'Weekly shop',
        amount: '−$165.20',
        date: 'Oct 4',
        category: 'Groceries',
        note: 'Market and bakery.',
    },
    {
        id: 'train',
        label: 'Train pass',
        amount: '−$92.00',
        date: 'Oct 2',
        category: 'Transport',
        note: 'Monthly pass.',
    },
    { id: 'pay', label: 'Salary', amount: '+$4,200.00', date: 'Oct 1', category: 'Income', note: 'October.' },
];

/** Open an entry and its row grows into its details (a view transition, with share="zen-morph"). */
export default function Detail() {
    const [open, setOpen] = useState<string | null>(null);
    const go = (id: string | null) => startTransition(() => setOpen(id));
    const entry = ENTRIES.find((e) => e.id === open);

    if (entry)
        return (
            <ViewTransition name={`entry-${entry.id}`} share="zen-morph">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle>{entry.label}</CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => go(null)}>
                            Back
                        </Button>
                    </CardHeader>
                    <p className="text-3xl font-semibold tabular-nums">{entry.amount}</p>
                    <CardDescription className="mt-1">
                        {entry.date} · {entry.category}
                    </CardDescription>
                    <p className="mt-4 text-sm">{entry.note}</p>
                </Card>
            </ViewTransition>
        );

    return (
        <TableContainer label="Entries" className="w-full max-w-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Entry</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead numeric>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ENTRIES.map((e) => (
                        <ViewTransition key={e.id} name={`entry-${e.id}`} share="zen-morph">
                            <TableRow onClick={() => go(e.id)} className="cursor-pointer">
                                <TableCell>
                                    <button
                                        type="button"
                                        onClick={() => go(e.id)}
                                        className="text-left outline-hidden focus-visible:underline"
                                    >
                                        {e.label}
                                    </button>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{e.date}</TableCell>
                                <TableCell numeric>{e.amount}</TableCell>
                            </TableRow>
                        </ViewTransition>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
