import {
    EditableCell,
    formatMoney,
    MoneyInput,
    Table,
    TableBody,
    TableContainer,
    TableFooter,
    TableFooterCell,
    TableHead,
    TableHeader,
    TableRow,
    TableSpacerRow,
    TreeCell,
    TreeLabel,
    TreeRow,
    useTree,
    useVirtualList,
} from '@rinzai/zen';
import { useRef, useState } from 'react';

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const ROW_HEIGHT = 36;

interface Line {
    key: string;
    label: string;
    /** Amount per month, in paise; groups add up their items. */
    amounts?: number[];
    items?: Line[];
}

const item = (label: string, rupees: number[]): Line => ({
    key: label.toLowerCase().replace(/\W+/g, '-'),
    label,
    amounts: rupees.map((r) => r * 100),
});

const PLAN: Line[] = [
    {
        key: 'home',
        label: 'Home',
        items: [
            item('Rent', [18500, 18500, 18500, 18500, 18500, 18500]),
            item('Electricity', [1400, 1250, 1600, 1900, 1700, 1300]),
            item('Internet', [799, 799, 799, 799, 799, 799]),
        ],
    },
    {
        key: 'food',
        label: 'Food',
        items: [
            item('Groceries', [9000, 9500, 12000, 9000, 9000, 9500]),
            item('Dining out', [3000, 2500, 6000, 2000, 2500, 3000]),
        ],
    },
    {
        key: 'transport',
        label: 'Transport',
        items: [
            item('Metro card', [1200, 1200, 1200, 1200, 1200, 1200]),
            item('Cabs', [1500, 1800, 2500, 1500, 1200, 1600]),
        ],
    },
];

const total = (line: Line, month: number): number =>
    line.items ? line.items.reduce((sum, i) => sum + total(i, month), 0) : (line.amounts?.[month] ?? 0);

/**
 * A budget grid like a planner: categories open into items, months run across,
 * and the header, first column and totals stay put while it scrolls either way.
 * Click an amount to change it. Rows are virtualized, so long plans stay fast.
 */
export default function Planner() {
    const [plan, setPlan] = useState(PLAN);
    const tree = useTree({ items: plan, getKey: (l) => l.key, getChildren: (l) => l.items, rowHeight: ROW_HEIGHT });
    const scrollRef = useRef<HTMLDivElement>(null);
    const rows = useVirtualList({ count: tree.rows.length, itemHeight: ROW_HEIGHT, scrollRef, overscan: 12 });
    const inr = (paise: number) => formatMoney(paise, 'INR', 'en-IN', { showDecimals: false });

    const setAmount = (key: string, month: number, paise: number | null) =>
        setPlan((p) =>
            p.map((group) => ({
                ...group,
                items: group.items?.map((i) =>
                    i.key === key ? { ...i, amounts: i.amounts!.map((a, m) => (m === month ? (paise ?? 0) : a)) } : i,
                ),
            })),
        );

    return (
        <TableContainer ref={scrollRef} label="Budget plan" className="max-h-80 w-full">
            <Table className="w-max min-w-full">
                <TableHeader>
                    <TableRow>
                        <TableHead sticky="left" className="min-w-44">
                            Budget
                        </TableHead>
                        {MONTHS.map((m) => (
                            <TableHead key={m} numeric className="min-w-28">
                                {m}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableSpacerRow height={rows.paddingTop} colSpan={MONTHS.length + 1} />
                    {rows.items.map(({ index }) => {
                        const row = tree.rows[index];
                        const line = row.item;
                        return (
                            <TreeRow key={row.key} row={row} tree={tree}>
                                <TreeCell sticky="left" className={row.hasChildren ? 'font-medium' : undefined}>
                                    <TreeLabel row={row} tree={tree}>
                                        <span className="truncate">{line.label}</span>
                                    </TreeLabel>
                                </TreeCell>
                                {MONTHS.map((month, m) => (
                                    <TreeCell key={month} numeric>
                                        {row.hasChildren ? (
                                            <span className="text-muted-foreground px-1.5">{inr(total(line, m))}</span>
                                        ) : (
                                            <EditableCell
                                                label={`${line.label}, ${month}: ${inr(total(line, m))}`}
                                                editor={(close) => (
                                                    <MoneyInput
                                                        compact
                                                        autoFocus
                                                        allowEmpty
                                                        aria-label={`${line.label}, ${month}`}
                                                        value={total(line, m)}
                                                        currency="INR"
                                                        locale="en-IN"
                                                        className="w-28"
                                                        onChange={(v) => {
                                                            setAmount(line.key, m, v);
                                                            close();
                                                        }}
                                                        onCancel={close}
                                                    />
                                                )}
                                            >
                                                {inr(total(line, m))}
                                            </EditableCell>
                                        )}
                                    </TreeCell>
                                ))}
                            </TreeRow>
                        );
                    })}
                    <TableSpacerRow height={rows.paddingBottom} colSpan={MONTHS.length + 1} />
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableFooterCell sticky="left">Total</TableFooterCell>
                        {MONTHS.map((month, m) => (
                            <TableFooterCell key={month} numeric>
                                {inr(plan.reduce((sum, g) => sum + total(g, m), 0))}
                            </TableFooterCell>
                        ))}
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}
