import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    TableSwipeAction,
    TableSwipeRow,
} from '@rinzai/zen';
import { useState } from 'react';

const ENTRIES = [
    { id: 1, label: 'Weekly shop', amount: '−$165' },
    { id: 2, label: 'Farmers market', amount: '−$42' },
    { id: 3, label: 'Train pass', amount: '−$92' },
    { id: 4, label: 'Dinner with Sam', amount: '−$78' },
];

/** On a phone, swipe a row left for its actions; with a keyboard, tab to them. */
export default function Swipe() {
    const [entries, setEntries] = useState(ENTRIES);
    return (
        <div className="flex w-full max-w-lg flex-col gap-3">
            <TableContainer label="Entries">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Entry</TableHead>
                            <TableHead numeric>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((e) => (
                            <TableSwipeRow
                                key={e.id}
                                actions={
                                    <TableSwipeAction
                                        tone="destructive"
                                        aria-label={`Delete ${e.label}`}
                                        onClick={() => setEntries((es) => es.filter((x) => x.id !== e.id))}
                                    >
                                        Delete
                                    </TableSwipeAction>
                                }
                            >
                                <TableCell>{e.label}</TableCell>
                                <TableCell numeric>{e.amount}</TableCell>
                            </TableSwipeRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {entries.length < ENTRIES.length && (
                <Button variant="ghost" className="self-start" onClick={() => setEntries(ENTRIES)}>
                    Bring them back
                </Button>
            )}
        </div>
    );
}
