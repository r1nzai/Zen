import {
    Button,
    SelectionBar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    TableSelectCell,
    TableSelectHead,
    useSelection,
} from '@rinzai/zen';
import { useState } from 'react';

const ENTRIES = [
    { id: 1, label: 'Weekly shop', amount: '−$165' },
    { id: 2, label: 'Farmers market', amount: '−$42' },
    { id: 3, label: 'Train pass', amount: '−$92' },
    { id: 4, label: 'Dinner with Sam', amount: '−$78' },
    { id: 5, label: 'Birthday lunch', amount: '−$92' },
];

/** Pick rows (shift-click for a run of them), then act on them all from the bar. */
export default function Selectable() {
    const [entries, setEntries] = useState(ENTRIES);
    const selection = useSelection(entries.map((e) => e.id));
    return (
        <>
            <TableContainer label="Entries" className="w-full max-w-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableSelectHead {...selection.allProps()} />
                            <TableHead>Entry</TableHead>
                            <TableHead numeric>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map((e) => (
                            <TableRow key={e.id} selected={selection.selected.has(e.id)}>
                                <TableSelectCell label={`Select ${e.label}`} {...selection.rowProps(e.id)} />
                                <TableCell>{e.label}</TableCell>
                                <TableCell numeric>{e.amount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <SelectionBar count={selection.selected.size} onClear={selection.clear}>
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setEntries((es) => es.filter((e) => !selection.selected.has(e.id)))}
                >
                    Delete
                </Button>
                {entries.length < ENTRIES.length && (
                    <Button size="sm" variant="ghost" onClick={() => setEntries(ENTRIES)}>
                        Restore all
                    </Button>
                )}
            </SelectionBar>
        </>
    );
}
