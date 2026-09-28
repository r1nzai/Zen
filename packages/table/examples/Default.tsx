import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@rinzai/zen';

const ENTRIES = [
    { label: 'Rent', category: 'Housing', amount: -1850, recurring: true },
    { label: 'Paycheck', category: 'Salary', amount: 8450, recurring: true },
    { label: 'Weekly shop', category: 'Groceries', amount: -164, recurring: false },
];

export default function Default() {
    return (
        <Table className="min-w-[28rem]">
            <TableHeader>
                <TableRow>
                    <TableHead>Entry</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ENTRIES.map((e) => (
                    <TableRow key={e.label}>
                        <TableCell className="font-medium">
                            {e.label} {e.recurring && <Badge variant="outline">Monthly</Badge>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{e.category}</TableCell>
                        <TableCell
                            className={
                                e.amount > 0 ? 'text-primary text-right tabular-nums' : 'text-right tabular-nums'
                            }
                        >
                            {e.amount > 0 ? '+' : '−'}${Math.abs(e.amount).toLocaleString('en-US')}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
