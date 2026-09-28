import { Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@rinzai/zen';

const ENTRIES = [
    { label: 'Rent', category: 'Housing', amount: -1850, recurring: true },
    { label: 'Paycheck', category: 'Salary', amount: 8450, recurring: true },
    { label: 'Weekly shop', category: 'Groceries', amount: -164, recurring: false },
];

export default function Default() {
    return (
        <TableContainer className="w-full max-w-xl">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Entry</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead numeric>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {ENTRIES.map((e) => (
                        <TableRow key={e.label}>
                            <TableCell className="font-medium">
                                {e.label} {e.recurring && <Badge variant="outline">Monthly</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{e.category}</TableCell>
                            <TableCell numeric className={e.amount > 0 ? 'text-primary' : undefined}>
                                {e.amount > 0 ? '+' : '−'}${Math.abs(e.amount).toLocaleString('en-US')}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
