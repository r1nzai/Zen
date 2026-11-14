import {
    formatMoney,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    TableSpacerRow,
    useVirtualList,
} from '@rinzai/zen';
import { useRef } from 'react';

const ROW_HEIGHT = 40;
const PAYEES = ['Grocer', 'Metro', 'Landlord', 'Cafe', 'Pharmacy', 'Bookshop', 'Cinema', 'Utilities'];

// 10,000 transactions, generated.
const ROWS = Array.from({ length: 10000 }, (_, i) => ({
    id: i + 1,
    date: new Date(2026, 0, 1 + Math.floor(i / 28)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    payee: PAYEES[(i * 7) % PAYEES.length],
    amount: ((i * 7919) % 20000) + 150,
}));

/** 10,000 rows, but only the ones in view (plus a few either side) are rendered: useVirtualList with spacer rows. */
export default function Virtual() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const rows = useVirtualList({ count: ROWS.length, itemHeight: ROW_HEIGHT, scrollRef, overscan: 8 });
    return (
        <TableContainer ref={scrollRef} label="Transactions" className="h-96 w-full max-w-xl">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead numeric className="w-20">
                            #
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Payee</TableHead>
                        <TableHead numeric>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableSpacerRow height={rows.paddingTop} colSpan={4} />
                    {rows.items.map(({ index }) => {
                        const r = ROWS[index];
                        return (
                            <TableRow key={r.id}>
                                <TableCell numeric className="text-muted-foreground h-10 py-0">
                                    {r.id}
                                </TableCell>
                                <TableCell className="h-10 py-0">{r.date}</TableCell>
                                <TableCell className="h-10 py-0">{r.payee}</TableCell>
                                <TableCell numeric className="h-10 py-0">
                                    {formatMoney(r.amount, 'USD', 'en-US')}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    <TableSpacerRow height={rows.paddingBottom} colSpan={4} />
                </TableBody>
            </Table>
        </TableContainer>
    );
}
