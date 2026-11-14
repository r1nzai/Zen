import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableEmpty,
    TableHead,
    TableHeader,
    TableRow,
    useSort,
} from '@rinzai/zen';

interface Payment {
    month: string;
    principal: number;
    interest: number;
    balance: number;
}

// An amortization schedule: 240 000 over 12 months at 9%.
const SCHEDULE: Payment[] = (() => {
    let balance = 240000;
    const rate = 0.09 / 12;
    const emi = (balance * rate) / (1 - (1 + rate) ** -12);
    return Array.from({ length: 12 }, (_, i) => {
        const interest = balance * rate;
        const principal = emi - interest;
        balance -= principal;
        return {
            month: new Date(2026, 9 + i).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
            principal,
            interest,
            balance: Math.max(0, balance),
        };
    });
})();

const COMPARE = {
    principal: (a: Payment, b: Payment) => a.principal - b.principal,
    interest: (a: Payment, b: Payment) => a.interest - b.interest,
    balance: (a: Payment, b: Payment) => a.balance - b.balance,
};

const money = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

/** Click a heading to sort by it, again to reverse, a third time to clear. The header stays put as the rows scroll. */
export default function Sortable() {
    const { rows, headProps } = useSort(SCHEDULE, COMPARE);
    return (
        <TableContainer label="Repayment schedule" className="max-h-80 w-full max-w-xl">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead numeric {...headProps('principal')}>
                            Principal
                        </TableHead>
                        <TableHead numeric {...headProps('interest')}>
                            Interest
                        </TableHead>
                        <TableHead numeric {...headProps('balance')}>
                            Balance
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 && <TableEmpty colSpan={4} />}
                    {rows.map((p) => (
                        <TableRow key={p.month}>
                            <TableCell>{p.month}</TableCell>
                            <TableCell numeric>{money(p.principal)}</TableCell>
                            <TableCell numeric className="text-muted-foreground">
                                {money(p.interest)}
                            </TableCell>
                            <TableCell numeric>{money(p.balance)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
