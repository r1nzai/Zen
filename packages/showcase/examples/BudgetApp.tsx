import { ReactNode, useEffect, useMemo, useState } from 'react';

import {
    AnimatedMoney,
    applyPreset,
    applyTheme,
    Avatar,
    Badge,
    Button,
    buttonVariants,
    Card,
    CardHeader,
    CardTitle,
    Collapse,
    Combobox,
    ComboboxCreate,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
    ConfirmDialog,
    customize,
    DEFAULT_THEME,
    Dialog,
    EditableCell,
    Field,
    formatMoney,
    FormMessage,
    Header,
    Input,
    type Money,
    MoneyInput,
    type Month,
    MonthPicker,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    Meter,
    Pill,
    PillIndicator,
    Pills,
    PageHeader,
    type PresetId,
    PRESETS,
    ProgressRing,
    resetTheme,
    Segmented,
    SegmentedItem,
    Select,
    SelectItem,
    Skeleton,
    Slider,
    Stat,
    StatRow,
    Tab,
    TabBar,
    TabBarItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableEmpty,
    TableFooter,
    TableFooterCell,
    TableHead,
    TableHeader,
    TableRow,
    TabList,
    TabPanel,
    Tabs,
    TextArea,
    ThemeToggle,
    type ThemeSettings,
    ToastProvider,
    Toggle,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TreeCell,
    TreeLabel,
    TreeRow,
    useSort,
    useToast,
    useTree,
} from '@rinzai/zen';
import CalendarIcon from '@zen/icons/calendar';
import Ellipsis from '@zen/icons/ellipsis';
import Flag from '@zen/icons/flag';
import Settings from '@zen/icons/settings';
import TableIcon from '@zen/icons/table';

/*
 * A small budget app built only from Zen: a sortable entries table you can
 * edit in place, spending by group in a tree with meters, goals, a live theme
 * editor, and dialogs with every kind of field. Amounts are integer cents.
 */

type Kind = 'expense' | 'income';
type CategoryKey = (typeof CATEGORIES)[number]['value'];

interface Entry {
    id: number;
    label: string;
    amount: Money;
    kind: Kind;
    category: CategoryKey;
    tags: string[];
    recurring: boolean;
}

const CATEGORIES = [
    { value: 'salary', label: 'Salary', group: 'Income', budget: 0 },
    { value: 'rent', label: 'Rent', group: 'Essentials', budget: 185000 },
    { value: 'groceries', label: 'Groceries', group: 'Essentials', budget: 60000 },
    { value: 'transport', label: 'Transport', group: 'Essentials', budget: 12000 },
    { value: 'dining', label: 'Dining out', group: 'Lifestyle', budget: 15000 },
    { value: 'subscriptions', label: 'Subscriptions', group: 'Lifestyle', budget: 4000 },
    { value: 'travel', label: 'Travel', group: 'Lifestyle', budget: 30000 },
] as const;
const categoryOf = (key: CategoryKey) => CATEGORIES.find((c) => c.value === key)!;

const TAGS = ['Essential', 'Shared', 'Work', 'Treat', 'Annual', 'Reimbursable', 'Cash'];
const asText = (tag: string) => tag;

const INITIAL: Entry[] = [
    { id: 1, label: 'Paycheck', amount: 845000, kind: 'income', category: 'salary', tags: ['Work'], recurring: true },
    {
        id: 2,
        label: 'Rent',
        amount: 185000,
        kind: 'expense',
        category: 'rent',
        tags: ['Essential', 'Shared'],
        recurring: true,
    },
    {
        id: 3,
        label: 'Weekly shop',
        amount: 16450,
        kind: 'expense',
        category: 'groceries',
        tags: ['Essential', 'Shared', 'Cash', 'Reimbursable'],
        recurring: false,
    },
    {
        id: 4,
        label: 'Farmers market',
        amount: 4200,
        kind: 'expense',
        category: 'groceries',
        tags: ['Cash'],
        recurring: false,
    },
    {
        id: 5,
        label: 'Train pass',
        amount: 9200,
        kind: 'expense',
        category: 'transport',
        tags: ['Work'],
        recurring: true,
    },
    {
        id: 6,
        label: 'Dinner with Sam',
        amount: 7800,
        kind: 'expense',
        category: 'dining',
        tags: ['Treat'],
        recurring: false,
    },
    {
        id: 7,
        label: 'Birthday lunch',
        amount: 9150,
        kind: 'expense',
        category: 'dining',
        tags: ['Treat', 'Shared'],
        recurring: false,
    },
    {
        id: 8,
        label: 'Music streaming',
        amount: 1199,
        kind: 'expense',
        category: 'subscriptions',
        tags: [],
        recurring: true,
    },
    {
        id: 9,
        label: 'Flights to Lisbon',
        amount: 41200,
        kind: 'expense',
        category: 'travel',
        tags: ['Treat', 'Annual'],
        recurring: false,
    },
    {
        id: 10,
        label: 'Freelance invoice',
        amount: 120000,
        kind: 'income',
        category: 'salary',
        tags: ['Work'],
        recurring: false,
    },
];

/** The "⋯" button that opens a row's or page's actions. */
const MORE = buttonVariants({ variant: 'icon', size: 'icon' });

const CURRENCY = 'USD';
const LOCALE = 'en-US';
const money = (m: Money) => formatMoney(m, CURRENCY, LOCALE, { showDecimals: false });
const signed = (e: Entry) => (e.kind === 'income' ? e.amount : -e.amount);

function Budget({ nav }: { nav: boolean }) {
    const toast = useToast();
    const [entries, setEntries] = useState(INITIAL);
    const [month, setMonth] = useState<Month | null>('2026-09');
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<Entry | null>(null);
    const [resetting, setResetting] = useState(false);
    const [loading, setLoading] = useState(false);

    const income = entries.filter((e) => e.kind === 'income').reduce((sum, e) => sum + e.amount, 0);
    const spent = entries.filter((e) => e.kind === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const update = (id: number, patch: Partial<Entry>) =>
        setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));

    const refresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast('Up to date', { description: 'Totals refreshed.', tone: 'success' });
        }, 1400);
    };

    const remove = (entry: Entry) => {
        setEntries((es) => es.filter((e) => e.id !== entry.id));
        toast('Entry deleted', {
            description: `${entry.label}, ${money(entry.amount)}`,
            action: { label: 'Undo', onClick: () => setEntries((es) => [...es, entry].sort((a, b) => a.id - b.id)) },
        });
    };

    return (
        <>
            {nav && <AppHeader />}
            <div className="rise mx-auto flex max-w-6xl flex-col gap-6 p-6 pb-28 md:p-10">
                <PageHeader
                    eyebrow="Budget"
                    title="Month overview"
                    lead="Where the money went, and what's left. Click an amount to change it."
                >
                    <div className="flex flex-wrap items-center gap-2">
                        <MonthPicker
                            aria-label="Month"
                            value={month}
                            onChange={setMonth}
                            locale={LOCALE}
                            className="w-40 max-sm:w-full"
                        />
                        {/* The actions wrap as one group, so the primary action never ends up alone on a line. */}
                        <div className="flex items-center gap-2">
                            <Button variant="outline" loading={loading} onClick={refresh}>
                                {loading ? 'Refreshing' : 'Refresh'}
                            </Button>
                            <Button onClick={() => setAdding(true)}>Add entry</Button>
                            <Menu>
                                <MenuTrigger aria-label="Budget actions" className={MORE}>
                                    <Ellipsis />
                                </MenuTrigger>
                                <MenuContent>
                                    <MenuItem onSelect={() => toast('Export started', { tone: 'info' })}>
                                        Export CSV
                                    </MenuItem>
                                    <MenuItem destructive onSelect={() => setResetting(true)}>
                                        Reset month
                                    </MenuItem>
                                </MenuContent>
                            </Menu>
                        </div>
                    </div>
                </PageHeader>

                <StatRow className="lg:gap-6">
                    {loading ? (
                        [0, 1, 2].map((i) => (
                            <div key={i} className="glass glow-edge flex flex-col gap-2 rounded-xl p-4">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-7 w-28" />
                            </div>
                        ))
                    ) : (
                        <>
                            <Stat
                                label="Income"
                                value={<AnimatedMoney value={income} currency={CURRENCY} locale={LOCALE} />}
                                hint="+4% on last month"
                            />
                            <Stat
                                label="Spent"
                                value={<AnimatedMoney value={spent} currency={CURRENCY} locale={LOCALE} />}
                                hint={income > 0 ? `${Math.round((spent / income) * 100)}% of income` : undefined}
                                tone="negative"
                            />
                            <Stat
                                label="Net this month"
                                value={<AnimatedMoney value={income - spent} currency={CURRENCY} locale={LOCALE} />}
                                tone={income >= spent ? 'positive' : 'negative'}
                            />
                        </>
                    )}
                </StatRow>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Entries</CardTitle>
                                <Badge variant="secondary">{entries.length} this month</Badge>
                            </CardHeader>
                            <Tabs defaultValue="all">
                                <TabList variant="pills">
                                    <Tab value="all">All</Tab>
                                    <Tab value="expense">Expenses</Tab>
                                    <Tab value="income">Income</Tab>
                                </TabList>
                                {(['all', 'expense', 'income'] as const).map((filter) => (
                                    <TabPanel key={filter} value={filter}>
                                        <EntryTable
                                            entries={entries.filter((e) => filter === 'all' || e.kind === filter)}
                                            onAmount={(id, amount) => update(id, { amount })}
                                            onDelete={setDeleting}
                                        />
                                    </TabPanel>
                                ))}
                            </Tabs>
                        </Card>
                        <SpendingByGroup entries={entries} />
                    </div>

                    <div className="flex flex-col gap-6">
                        <BudgetMeters entries={entries} />
                        <Goals />
                        <Appearance />
                    </div>
                </div>
            </div>

            {nav && <AppTabBar />}

            <AddEntryDialog
                open={adding}
                onOpenChange={setAdding}
                onAdd={(entry) => {
                    setEntries((es) => [...es, { ...entry, id: Math.max(0, ...es.map((e) => e.id)) + 1 }]);
                    toast('Entry added', { description: `${entry.label}, ${money(entry.amount)}`, tone: 'success' });
                }}
            />
            <ConfirmDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete this entry?"
                description={deleting ? `${deleting.label} (${money(deleting.amount)}) will be removed.` : undefined}
                confirmLabel="Delete"
                destructive
                onConfirm={() => deleting && remove(deleting)}
            />
            <ConfirmDialog
                open={resetting}
                onOpenChange={setResetting}
                title="Reset this month?"
                description="Every entry goes back to the sample data."
                confirmLabel="Reset"
                destructive
                onConfirm={() => {
                    setEntries(INITIAL);
                    toast('Month reset', { tone: 'info' });
                }}
            />
        </>
    );
}

// ── Navigation ──

const PAGES = ['Month', 'Planner', 'Goals', 'Settings'];

/** The app's top bar. A router would set the current page; here clicks just move it. */
function AppHeader() {
    const [page, setPage] = useState('Month');
    return (
        <Header>
            <span className="text-lg font-semibold tracking-tight">Zen</span>
            <nav aria-label="Main" className="max-md:hidden">
                <Pills>
                    <PillIndicator />
                    {PAGES.map((p) => (
                        <Pill
                            key={p}
                            href={`#${p.toLowerCase()}`}
                            active={p === page}
                            onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                            }}
                        >
                            {p}
                        </Pill>
                    ))}
                </Pills>
            </nav>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Avatar name="Rin" className="size-8 text-xs" />
            </div>
        </Header>
    );
}

const TAB_ICONS: Record<string, ReactNode> = {
    Month: <CalendarIcon />,
    Planner: <TableIcon />,
    Goals: <Flag />,
    Settings: <Settings />,
};

/** Phone navigation, in place of the top bar's pills. */
function AppTabBar() {
    const [page, setPage] = useState('Month');
    return (
        <TabBar aria-label="Main">
            {PAGES.map((p) => (
                <TabBarItem
                    key={p}
                    href={`#${p.toLowerCase()}`}
                    icon={TAB_ICONS[p]}
                    active={p === page}
                    onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                    }}
                >
                    {p}
                </TabBarItem>
            ))}
        </TabBar>
    );
}

// ── Entries ──

const COMPARE = {
    label: (a: Entry, b: Entry) => a.label.localeCompare(b.label),
    amount: (a: Entry, b: Entry) => signed(a) - signed(b),
};

/** Sortable, with amounts edited in place and tags that collapse to "+N". */
function EntryTable({
    entries,
    onAmount,
    onDelete,
}: {
    entries: Entry[];
    onAmount: (id: number, amount: Money) => void;
    onDelete: (entry: Entry) => void;
}) {
    const { rows, headProps } = useSort(entries, COMPARE);
    const total = entries.reduce((sum, e) => sum + signed(e), 0);
    return (
        <TableContainer label="Entries" className="mt-4 max-h-96">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead {...headProps('label')}>Entry</TableHead>
                        <TableHead className="max-sm:hidden">Tags</TableHead>
                        <TableHead numeric {...headProps('amount')}>
                            Amount
                        </TableHead>
                        <TableHead>
                            <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length === 0 && <TableEmpty colSpan={4} />}
                    {rows.map((e) => (
                        <TableRow key={e.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{e.label}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {categoryOf(e.category).label}
                                        {e.recurring && ' · monthly'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="w-48 max-sm:hidden">
                                <TagList tags={e.tags} />
                            </TableCell>
                            <TableCell numeric className="w-36 py-1.5 max-sm:w-auto">
                                <EditableCell
                                    label={`${e.label}: ${money(e.amount)}`}
                                    className={e.kind === 'income' ? 'text-primary text-glow' : undefined}
                                    editor={(close) => (
                                        <MoneyInput
                                            compact
                                            autoFocus
                                            aria-label={e.label}
                                            value={e.amount}
                                            currency={CURRENCY}
                                            locale={LOCALE}
                                            onChange={(v) => {
                                                if (v !== null && v > 0) onAmount(e.id, v);
                                                close();
                                            }}
                                            onCancel={close}
                                        />
                                    )}
                                >
                                    {e.kind === 'income' ? '+' : '−'}
                                    {money(e.amount)}
                                </EditableCell>
                            </TableCell>
                            <TableCell className="w-10 px-1">
                                <Menu>
                                    <MenuTrigger aria-label={`Actions for ${e.label}`} className={MORE}>
                                        <Ellipsis />
                                    </MenuTrigger>
                                    <MenuContent>
                                        <MenuItem destructive onSelect={() => onDelete(e)}>
                                            Delete
                                        </MenuItem>
                                    </MenuContent>
                                </Menu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableFooterCell>Net</TableFooterCell>
                        {/* Its own cell under Tags, hidden with that column: a colSpan would keep a phantom column on phones. */}
                        <TableFooterCell className="max-sm:hidden" />
                        <TableFooterCell numeric className={total >= 0 ? 'text-primary' : 'text-destructive'}>
                            {total >= 0 ? '+' : '−'}
                            {money(Math.abs(total))}
                        </TableFooterCell>
                        <TableFooterCell />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}

/** As many tags as fit on one line; the rest behind "+N". */
function TagList({ tags }: { tags: string[] }) {
    return (
        <Collapse items={tags} className="gap-1">
            {(t) => <Badge variant="secondary">{t}</Badge>}
        </Collapse>
    );
}

// ── Spending ──

interface GroupRow {
    name: string;
    spent: Money;
    budget: Money;
    children?: GroupRow[];
}

/** Groups of categories in a tree; each row's meter shows spend against its budget. */
function SpendingByGroup({ entries }: { entries: Entry[] }) {
    const groups = useMemo(() => {
        const out: GroupRow[] = [];
        for (const c of CATEGORIES) {
            if (c.group === 'Income') continue;
            const spent = entries
                .filter((e) => e.kind === 'expense' && e.category === c.value)
                .reduce((sum, e) => sum + e.amount, 0);
            let group = out.find((g) => g.name === c.group);
            if (!group) out.push((group = { name: c.group, spent: 0, budget: 0, children: [] }));
            group.children!.push({ name: c.label, spent, budget: c.budget });
            group.spent += spent;
            group.budget += c.budget;
        }
        return out;
    }, [entries]);
    const tree = useTree({ items: groups, getKey: (g) => g.name, getChildren: (g) => g.children });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by group</CardTitle>
            </CardHeader>
            <TableContainer className="-mx-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead numeric>Spent</TableHead>
                            <TableHead numeric className="max-sm:hidden">
                                Budget
                            </TableHead>
                            <TableHead className="w-2/5">Used</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tree.rows.map((row) => (
                            <TreeRow key={row.key} row={row} tree={tree}>
                                <TreeCell className={row.hasChildren ? 'font-medium' : undefined}>
                                    <TreeLabel row={row} tree={tree}>
                                        {row.item.name}
                                    </TreeLabel>
                                </TreeCell>
                                <TreeCell numeric>{money(row.item.spent)}</TreeCell>
                                <TreeCell numeric className="text-muted-foreground max-sm:hidden">
                                    {money(row.item.budget)}
                                </TreeCell>
                                <TreeCell>
                                    <Meter
                                        className="w-full"
                                        value={row.item.spent}
                                        max={row.item.budget}
                                        valueText={`${money(row.item.spent)} of ${money(row.item.budget)}`}
                                    />
                                </TreeCell>
                            </TreeRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Card>
    );
}

/** The categories closest to their limit. */
function BudgetMeters({ entries }: { entries: Entry[] }) {
    const rows = CATEGORIES.filter((c) => c.budget > 0)
        .map((c) => ({
            ...c,
            spent: entries
                .filter((e) => e.kind === 'expense' && e.category === c.value)
                .reduce((sum, e) => sum + e.amount, 0),
        }))
        .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
        .slice(0, 3);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Watch list</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-5">
                {rows.map((c) => {
                    const over = c.spent > c.budget;
                    const status = over ? `${money(c.spent - c.budget)} over` : `${money(c.budget - c.spent)} left`;
                    return (
                        <Meter
                            key={c.value}
                            label={c.label}
                            value={c.spent}
                            max={c.budget}
                            detail={`${money(c.spent)} / ${money(c.budget)}`}
                            hint={status}
                            valueText={`${money(c.spent)} of ${money(c.budget)}, ${status}`}
                        />
                    );
                })}
            </div>
        </Card>
    );
}

// ── Goals ──

function Goals() {
    const [monthly, setMonthly] = useState(400);
    const goals = [
        { name: 'Emergency fund', saved: 640000, target: 1000000 },
        { name: 'New laptop', saved: 56000, target: 200000 },
    ];
    const left = goals.reduce((sum, g) => sum + g.target - g.saved, 0);
    const months = Math.ceil(left / (monthly * 100));
    return (
        <Card>
            <CardHeader>
                <CardTitle>Goals</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-4">
                {goals.map((g) => (
                    <div key={g.name} className="flex items-center gap-4">
                        <ProgressRing value={g.saved / g.target} size={56} stroke={5} label={g.name}>
                            <span className="text-xs font-semibold tabular-nums">
                                {Math.round((g.saved / g.target) * 100)}%
                            </span>
                        </ProgressRing>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{g.name}</span>
                            <span className="text-muted-foreground text-xs tabular-nums">
                                {money(g.saved)} of {money(g.target)}
                            </span>
                        </div>
                    </div>
                ))}
                <div className="border-tint/[0.07] flex flex-col gap-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium">Put aside each month</span>
                        <span className="text-muted-foreground tabular-nums">{money(monthly * 100)}</span>
                    </div>
                    <Slider
                        aria-label="Put aside each month"
                        min={50}
                        max={1500}
                        step={50}
                        value={monthly}
                        onValueChange={setMonthly}
                        valueText={(v) => money(v * 100)}
                    />
                    <p className="text-muted-foreground mt-0! text-xs">Both goals reached in about {months} months.</p>
                </div>
            </div>
        </Card>
    );
}

// ── Appearance ──

const HUES = `linear-gradient(to right, ${Array.from({ length: 13 }, (_, i) => `oklch(0.72 0.13 ${i * 30})`).join(', ')})`;

/** A live theme editor: presets, any hue, glow and motion, in dark and light. */
function Appearance() {
    const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        const apply = () => applyTheme(theme, { appearance: root.classList.contains('light') ? 'light' : 'dark' });
        apply();
        // ThemeToggle flips <html> between .dark and .light: re-apply for the new appearance.
        const watch = new MutationObserver(apply);
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => watch.disconnect();
    }, [theme]);
    useEffect(() => () => resetTheme(), []);
    useEffect(() => {
        document.documentElement.classList.toggle('reduce-motion', reduceMotion);
        return () => document.documentElement.classList.remove('reduce-motion');
    }, [reduceMotion]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <Tooltip>
                    <TooltipTrigger aria-label="About appearance" className="rounded-md">
                        <Badge variant="outline">?</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-muted-foreground mt-0! max-w-56 p-3 text-xs leading-5">
                            Every colour comes from these few settings, and stays readable in both themes.
                        </p>
                    </TooltipContent>
                </Tooltip>
            </CardHeader>
            <div className="flex flex-col gap-5">
                <Field label="Preset">
                    <Select
                        value={theme.preset === 'custom' ? null : theme.preset}
                        placeholder="Custom"
                        onChange={(id: PresetId) => setTheme((t) => applyPreset(t, id))}
                    >
                        {PRESETS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.label}
                            </SelectItem>
                        ))}
                    </Select>
                </Field>
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Hue</span>
                    <Slider
                        aria-label="Hue"
                        min={0}
                        max={359}
                        value={theme.hue}
                        onValueChange={(hue) => setTheme((t) => customize(t, { hue }))}
                        trackBackground={HUES}
                        thumbColor={`oklch(0.72 0.13 ${theme.hue})`}
                        valueText={(v) => `Hue ${v} degrees`}
                    />
                </div>
                <Segmented label="Glow" value={theme.glow} onChange={(glow) => setTheme((t) => ({ ...t, glow }))}>
                    <SegmentedItem value="off">Off</SegmentedItem>
                    <SegmentedItem value="soft">Soft</SegmentedItem>
                    <SegmentedItem value="bright">Bright</SegmentedItem>
                </Segmented>
                <label className="flex items-center justify-between gap-4 text-sm">
                    Reduce motion
                    <Toggle checked={reduceMotion} onChange={setReduceMotion} aria-label="Reduce motion" />
                </label>
            </div>
        </Card>
    );
}

// ── Add entry ──

function AddEntryDialog({
    open,
    onOpenChange,
    onAdd,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (entry: Omit<Entry, 'id'>) => void;
}) {
    const blank = useMemo(
        () => ({
            label: '',
            amount: null as Money | null,
            kind: 'expense' as Kind,
            category: 'groceries' as CategoryKey,
            tags: [] as string[],
            month: '2026-09' as Month | null,
            recurring: false,
            note: '',
        }),
        [],
    );
    const [form, setForm] = useState(blank);
    const [submitted, setSubmitted] = useState(false);
    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [key]: value }));
    const errors = {
        label: form.label.trim() === '' ? 'Describe the entry.' : undefined,
        amount: !form.amount || form.amount <= 0 ? 'Enter an amount above zero.' : undefined,
    };
    const valid = !errors.label && !errors.amount;

    const close = () => {
        onOpenChange(false);
        setForm(blank);
        setSubmitted(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => (o ? onOpenChange(true) : close())}
            title="Add entry"
            description="Amounts are in US dollars."
        >
            <form
                noValidate
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                    if (!valid) return;
                    onAdd({
                        label: form.label.trim(),
                        amount: form.amount!,
                        kind: form.kind,
                        category: form.category,
                        tags: form.tags,
                        recurring: form.recurring,
                    });
                    close();
                }}
            >
                <Segmented label="Type" value={form.kind} onChange={(kind) => set('kind', kind)}>
                    <SegmentedItem value="expense">Expense</SegmentedItem>
                    <SegmentedItem value="income">Income</SegmentedItem>
                </Segmented>
                <div className="grid gap-3 sm:grid-cols-[3fr_2fr]">
                    <Field label="Description" error={submitted ? errors.label : undefined}>
                        <Input
                            value={form.label}
                            onChange={(e) => set('label', e.target.value)}
                            placeholder="Weekly shop"
                        />
                    </Field>
                    <Field label="Amount" error={submitted ? errors.amount : undefined}>
                        <MoneyInput
                            live
                            allowEmpty
                            value={form.amount}
                            onChange={(v) => set('amount', v)}
                            currency={CURRENCY}
                            locale={LOCALE}
                        />
                    </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Category">
                        <Select value={form.category} onChange={(c) => set('category', c)}>
                            {CATEGORIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </Field>
                    <Field label="Month">
                        <MonthPicker value={form.month} onChange={(m) => set('month', m)} locale={LOCALE} />
                    </Field>
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Tags</span>
                    <Combobox
                        multiple
                        items={[...new Set([...TAGS, ...form.tags])]}
                        itemKey={asText}
                        itemText={asText}
                        value={form.tags}
                        onValueChange={(t) => set('tags', t)}
                    >
                        <ComboboxTrigger placeholder="None" className="w-full" />
                        <ComboboxPopup>
                            <ComboboxSearch />
                            <ComboboxList>
                                <ComboboxCreate onCreate={(tag) => set('tags', [...form.tags, tag])} />
                            </ComboboxList>
                        </ComboboxPopup>
                    </Combobox>
                </div>
                <Field label="Note" hint="Only you can see this.">
                    <TextArea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional" />
                </Field>
                <label className="flex items-center justify-between gap-4 text-sm">
                    Repeats every month
                    <Toggle
                        checked={form.recurring}
                        onChange={(r) => set('recurring', r)}
                        aria-label="Repeats every month"
                    />
                </label>
                {submitted && !valid && <FormMessage tone="error">Fix the fields above to add it.</FormMessage>}
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="submit">Add entry</Button>
                </div>
            </form>
        </Dialog>
    );
}

/** `nav={false}` drops the app's own top bar and tab bar, for pages that already have one. */
export default function BudgetApp({ nav = true }: { nav?: boolean }) {
    return (
        <ToastProvider>
            <Budget nav={nav} />
        </ToastProvider>
    );
}
