import { ReactNode, startTransition, useEffect, useMemo, useState, ViewTransition } from 'react';

import {
    AnimatedMoney,
    applyPreset,
    applyTheme,
    Avatar,
    Badge,
    Breadcrumb,
    Breadcrumbs,
    Button,
    buttonVariants,
    Card,
    CardHeader,
    CardTitle,
    Collapse,
    Combobox,
    ComboboxEmpty,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
    type CommandItem,
    CommandPalette,
    ConfirmDialog,
    customize,
    DEFAULT_THEME,
    Dialog,
    EditableCell,
    EmptyState,
    Field,
    FileDrop,
    formatMoney,
    formatMonth,
    FormMessage,
    Header,
    Input,
    Kbd,
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
    Pagination,
    type PresetId,
    PRESETS,
    ProgressRing,
    reducedMotion,
    resetTheme,
    Segmented,
    SegmentedItem,
    Select,
    SelectItem,
    Skeleton,
    Slider,
    Sparkline,
    Stat,
    StatRow,
    Step,
    Stepper,
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
    TagInput,
    TextArea,
    ThemeToggle,
    type ThemeSettings,
    Timeline,
    TimelineItem,
    ToastProvider,
    Toggle,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TreeCell,
    TreeLabel,
    TreeRow,
    useCommandPaletteShortcut,
    useSort,
    useToast,
    useTree,
} from '@rinzai/zen';
import CalendarIcon from '@zen/icons/calendar';
import ChartBar from '@zen/icons/chart-bar';
import Ellipsis from '@zen/icons/ellipsis';
import Flag from '@zen/icons/flag';
import ListBullet from '@zen/icons/list-bullet';
import Search from '@zen/icons/search';
import Settings from '@zen/icons/settings';
import TableIcon from '@zen/icons/table';

/*
 * A small budget app built only from Zen: a sortable, paged entries table you
 * can edit in place, spending by group in a tree with meters, recent activity,
 * goals that open into their details, a live theme editor, a statement import,
 * a command palette (⌘K), and dialogs with every kind of field. Amounts are
 * integer cents.
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

/** Words in an imported row's description that say which category it is. */
const CATEGORY_WORDS: [CategoryKey, RegExp][] = [
    ['rent', /rent|landlord|lettings/i],
    ['groceries', /grocer|market|supermarket|shop/i],
    ['transport', /train|bus|metro|taxi|uber|fuel|parking/i],
    ['dining', /restaurant|cafe|coffee|dinner|lunch|bar|pizza/i],
    ['subscriptions', /subscription|streaming|music|netflix|spotify|cloud/i],
    ['travel', /flight|hotel|airline|airbnb|travel/i],
];

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
const now = () => `Today, ${new Date().toLocaleTimeString(LOCALE, { hour: 'numeric', minute: '2-digit' })}`;

/** The months before this one, in dollars: where the stats' trend lines come from. */
const INCOME_BEFORE = [8100, 8300, 7900, 8600, 8200, 8450, 9300];
const SPENT_BEFORE = [5400, 5900, 5200, 6100, 5600, 5800, 5100];

interface Activity {
    id: number;
    title: string;
    detail?: string;
    time: string;
}

const EARLIER: Activity[] = [
    { id: -1, title: 'Paycheck received', detail: '+$8,450 from Northwind', time: '1 Sep' },
    { id: -2, title: 'Rent paid', detail: '−$1,850 to Northside Lettings', time: '1 Sep' },
    { id: -3, title: 'Goal reached 60%', detail: 'Emergency fund', time: '28 Aug' },
];

/** Jumps to a section of the page, as an in-page link would. */
const goTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });

function Budget({ nav }: { nav: boolean }) {
    const toast = useToast();
    const [entries, setEntries] = useState(INITIAL);
    const [month, setMonth] = useState<Month | null>('2026-09');
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<Entry | null>(null);
    const [resetting, setResetting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activity, setActivity] = useState(EARLIER);
    const log = (title: string, detail?: string) =>
        setActivity((a) => [{ id: Date.now(), title, detail, time: now() }, ...a]);
    useCommandPaletteShortcut(() => setSearching(true));

    const income = entries.filter((e) => e.kind === 'income').reduce((sum, e) => sum + e.amount, 0);
    const spent = entries.filter((e) => e.kind === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const update = (id: number, patch: Partial<Entry>) =>
        setEntries((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const add = (added: Omit<Entry, 'id'>[]) =>
        setEntries((es) => {
            const next = Math.max(0, ...es.map((e) => e.id)) + 1;
            return [...es, ...added.map((e, i) => ({ ...e, id: next + i }))];
        });

    const refresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast('Up to date', { description: 'Totals refreshed.', tone: 'success' });
        }, 1400);
    };

    const remove = (entry: Entry) => {
        setEntries((es) => es.filter((e) => e.id !== entry.id));
        log('Entry deleted', `${entry.label}, ${money(entry.amount)}`);
        toast('Entry deleted', {
            description: `${entry.label}, ${money(entry.amount)}`,
            action: { label: 'Undo', onClick: () => setEntries((es) => [...es, entry].sort((a, b) => a.id - b.id)) },
        });
    };

    const commands: CommandItem[] = [
        ...[
            ['entries', 'Entries'],
            ['spending', 'Spending by group'],
            ['watch-list', 'Watch list'],
            ['activity', 'Recent activity'],
            ['goals', 'Goals'],
            ['appearance', 'Appearance'],
        ].map(([id, label]) => ({ label, group: 'Go to', onSelect: () => goTo(id) })),
        { label: 'Add entry', group: 'Actions', icon: <ListBullet />, onSelect: () => setAdding(true) },
        {
            label: 'Import a statement',
            group: 'Actions',
            keywords: ['csv', 'bank', 'upload'],
            onSelect: () => setImporting(true),
        },
        { label: 'Refresh totals', group: 'Actions', icon: <ChartBar />, onSelect: refresh },
        {
            label: 'Export CSV',
            group: 'Actions',
            keywords: ['download'],
            onSelect: () => toast('Export started', { tone: 'info' }),
        },
        { label: 'Reset month', group: 'Actions', keywords: ['clear'], onSelect: () => setResetting(true) },
    ];
    const trend = (before: number[], now: Money) => [...before, now / 100];

    return (
        <>
            {nav && <AppHeader />}
            <div className="rise mx-auto flex max-w-6xl flex-col gap-6 p-6 pb-28 md:p-10">
                <Breadcrumbs className="-mb-3">
                    <Breadcrumb href="#budgets" onClick={(e) => e.preventDefault()}>
                        Budgets
                    </Breadcrumb>
                    <Breadcrumb current>{month ? formatMonth(month, LOCALE, 'long') : 'All months'}</Breadcrumb>
                </Breadcrumbs>
                <PageHeader
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
                            <Tooltip>
                                <TooltipTrigger
                                    aria-label="Search"
                                    aria-keyshortcuts="Meta+K Control+K"
                                    className={MORE}
                                    onClick={() => setSearching(true)}
                                >
                                    <Search />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="mt-0! flex items-center gap-1 px-2.5 py-1.5 text-xs">
                                        Search <Kbd>⌘</Kbd>
                                        <Kbd>K</Kbd>
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                            <Menu>
                                <MenuTrigger aria-label="Budget actions" className={MORE}>
                                    <Ellipsis />
                                </MenuTrigger>
                                <MenuContent>
                                    <MenuItem onSelect={() => setImporting(true)}>Import statement</MenuItem>
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
                    {(
                        [
                            ['Income', income, '+4% on last month', 'default', trend(INCOME_BEFORE, income), 'primary'],
                            [
                                'Spent',
                                spent,
                                income > 0 ? `${Math.round((spent / income) * 100)}% of income` : undefined,
                                'negative',
                                trend(SPENT_BEFORE, spent),
                                'negative',
                            ],
                            [
                                'Net this month',
                                income - spent,
                                undefined,
                                income >= spent ? 'positive' : 'negative',
                                trend(
                                    INCOME_BEFORE.map((v, i) => v - SPENT_BEFORE[i]),
                                    income - spent,
                                ),
                                'primary',
                            ],
                        ] as const
                    ).map(([label, value, hint, tone, values, line]) => (
                        <Stat
                            key={label}
                            label={label}
                            tone={tone}
                            hint={hint}
                            value={
                                <Skeleton loading={loading} className="my-1 h-6 w-28">
                                    <span>
                                        <AnimatedMoney value={value} currency={CURRENCY} locale={LOCALE} />
                                    </span>
                                </Skeleton>
                            }
                        >
                            <Skeleton loading={loading} className="mt-2 h-8 w-full">
                                <Sparkline values={values} tone={line} className="mt-2 h-8 w-full" />
                            </Skeleton>
                        </Stat>
                    ))}
                </StatRow>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
                        <Card id="entries" className="scroll-mt-24">
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
                                            onAmount={(id, amount) => {
                                                const entry = entries.find((e) => e.id === id)!;
                                                update(id, { amount });
                                                log(
                                                    'Amount changed',
                                                    `${entry.label}: ${money(entry.amount)} → ${money(amount)}`,
                                                );
                                            }}
                                            onDelete={setDeleting}
                                            onAdd={() => setAdding(true)}
                                        />
                                    </TabPanel>
                                ))}
                            </Tabs>
                        </Card>
                        <SpendingByGroup entries={entries} />
                    </div>

                    <div className="flex flex-col gap-6">
                        <BudgetMeters entries={entries} />
                        <RecentActivity activity={activity} />
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
                    add([entry]);
                    log('Entry added', `${entry.label}, ${money(entry.amount)}`);
                    toast('Entry added', { description: `${entry.label}, ${money(entry.amount)}`, tone: 'success' });
                }}
            />
            <ImportDialog
                open={importing}
                onOpenChange={setImporting}
                onImport={(rows, from) => {
                    add(rows);
                    log('Statement imported', `${rows.length} entries from ${from}`);
                    toast('Statement imported', { description: `${rows.length} entries added.`, tone: 'success' });
                }}
            />
            <CommandPalette
                open={searching}
                onOpenChange={setSearching}
                items={commands}
                placeholder="Jump to a section, or run an action…"
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
                    log('Month reset');
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

const PAGE = 6;

/** Sortable and paged, with amounts edited in place and tags that collapse to "+N". */
function EntryTable({
    entries,
    onAmount,
    onDelete,
    onAdd,
}: {
    entries: Entry[];
    onAmount: (id: number, amount: Money) => void;
    onDelete: (entry: Entry) => void;
    onAdd: () => void;
}) {
    const { rows, headProps } = useSort(entries, COMPARE);
    const total = entries.reduce((sum, e) => sum + signed(e), 0);
    const pages = Math.max(1, Math.ceil(rows.length / PAGE));
    const [chosen, setPage] = useState(1);
    // Deleting the last entry on the last page leaves you on the page before.
    const page = Math.min(chosen, pages);
    return (
        <>
            <TableContainer label="Entries" className="mt-4">
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
                        {rows.length === 0 && (
                            <TableEmpty colSpan={4}>
                                <EmptyState
                                    icon={<ListBullet />}
                                    title="Nothing here yet"
                                    description="Add an entry, or import a bank statement."
                                >
                                    <Button size="sm" onClick={onAdd}>
                                        Add entry
                                    </Button>
                                </EmptyState>
                            </TableEmpty>
                        )}
                        {rows.slice((page - 1) * PAGE, page * PAGE).map((e) => (
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
            {pages > 1 && <Pagination page={page} count={pages} onPageChange={setPage} className="mt-4 self-center" />}
        </>
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
        <Card id="spending" className="scroll-mt-24">
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
        <Card id="watch-list" className="scroll-mt-24">
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

// ── Activity ──

/** What happened lately, newest first; it grows as you add, change, import and delete. */
function RecentActivity({ activity }: { activity: Activity[] }) {
    return (
        <Card id="activity" className="scroll-mt-24">
            <CardHeader>
                <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <Timeline>
                {activity.slice(0, 4).map((a, i) => (
                    <TimelineItem key={a.id} active={i === 0} title={a.title} time={a.time}>
                        {a.detail}
                    </TimelineItem>
                ))}
            </Timeline>
        </Card>
    );
}

// ── Goals ──

const GOALS = [
    {
        id: 'emergency',
        name: 'Emergency fund',
        saved: 640000,
        target: 1000000,
        history: [3800, 4300, 4900, 5400, 5900, 6400],
    },
    { id: 'laptop', name: 'New laptop', saved: 56000, target: 200000, history: [0, 100, 210, 300, 420, 560] },
];

/** Each goal opens into its details, morphing out of its row (a view transition, zen-morph). */
function Goals() {
    const [monthly, setMonthly] = useState(400);
    const [openId, setOpenId] = useState<string | null>(null);
    const open = GOALS.find((g) => g.id === openId);
    const show = (id: string | null) => startTransition(() => setOpenId(id));
    const left = GOALS.reduce((sum, g) => sum + g.target - g.saved, 0);
    const months = Math.ceil(left / (monthly * 100));
    const percent = (g: (typeof GOALS)[number]) => Math.round((g.saved / g.target) * 100);
    return (
        <Card id="goals" className="scroll-mt-24">
            <CardHeader>
                <CardTitle>Goals</CardTitle>
                {open && (
                    <Button size="sm" variant="ghost" onClick={() => show(null)}>
                        All goals
                    </Button>
                )}
            </CardHeader>
            {open ? (
                <ViewTransition name={`goal-${open.id}`} share="zen-morph">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <ProgressRing value={open.saved / open.target} size={88} stroke={7} label={open.name}>
                                <span className="text-base font-semibold tabular-nums">{percent(open)}%</span>
                            </ProgressRing>
                            <div className="flex flex-col">
                                <span className="font-medium">{open.name}</span>
                                <span className="text-muted-foreground text-sm tabular-nums">
                                    {money(open.saved)} of {money(open.target)}
                                </span>
                                <span className="text-muted-foreground text-xs tabular-nums">
                                    {money(open.target - open.saved)} to go
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-muted-foreground text-xs">Saved over the last 6 months</span>
                            <Sparkline values={open.history} className="h-16 w-full" />
                        </div>
                    </div>
                </ViewTransition>
            ) : (
                <div className="flex flex-col gap-4">
                    {GOALS.map((g) => (
                        <ViewTransition key={g.id} name={`goal-${g.id}`} share="zen-morph">
                            <button
                                type="button"
                                onClick={() => show(g.id)}
                                className="hover:bg-tint/[0.04] focus-visible:ring-ring/50 -m-2 flex cursor-pointer items-center gap-4 rounded-xl p-2 text-left outline-hidden transition-colors focus-visible:ring-2"
                            >
                                <ProgressRing value={g.saved / g.target} size={56} stroke={5} label={g.name}>
                                    <span className="text-xs font-semibold tabular-nums">{percent(g)}%</span>
                                </ProgressRing>
                                <span className="flex flex-col">
                                    <span className="text-sm font-medium">{g.name}</span>
                                    <span className="text-muted-foreground text-xs tabular-nums">
                                        {money(g.saved)} of {money(g.target)}
                                    </span>
                                </span>
                            </button>
                        </ViewTransition>
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
                        <p className="text-muted-foreground mt-0! text-xs">
                            Both goals reached in about {months} months.
                        </p>
                    </div>
                </div>
            )}
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
        <Card id="appearance" className="scroll-mt-24">
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
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Category</span>
                        <Combobox
                            items={[...CATEGORIES]}
                            itemKey={(c) => c.value}
                            itemText={(c) => c.label}
                            value={form.category}
                            onValueChange={(c: string) => set('category', c as CategoryKey)}
                        >
                            <ComboboxTrigger className="w-full" />
                            <ComboboxPopup>
                                <ComboboxSearch placeholder="Search categories" />
                                <ComboboxList>
                                    <ComboboxEmpty>No category by that name</ComboboxEmpty>
                                </ComboboxList>
                            </ComboboxPopup>
                        </Combobox>
                    </div>
                    <Field label="Month">
                        <MonthPicker value={form.month} onChange={(m) => set('month', m)} locale={LOCALE} />
                    </Field>
                </div>
                <Field label="Tags" hint="Press Enter or a comma after each.">
                    <TagInput value={form.tags} onValueChange={(t) => set('tags', t)} placeholder="Shared, Work…" />
                </Field>
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

// ── Import ──

const SAMPLE_STATEMENT = `Date,Description,Amount
2026-09-03,Corner Market,-38.40
2026-09-05,City Metro top-up,-25.00
2026-09-08,Cafe Aurora,-14.60
2026-09-12,Cloud storage subscription,-2.99
2026-09-15,Expense refund,62.00
2026-09-19,Pizza night,-31.80`;

/** Rows with a description and an amount, from a bank's CSV: spending is negative. */
function parseStatement(text: string): Omit<Entry, 'id'>[] {
    const out: Omit<Entry, 'id'>[] = [];
    for (const line of text.split(/\r?\n/)) {
        const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const amountCell = cells.find((c) => /^[-−+]?\s*[$€£]?\s*[\d,]*\.?\d+$/.test(c));
        const label = cells.find((c) => c && c !== amountCell && !/^[\d\s./-]+$/.test(c));
        if (!amountCell || !label) continue;
        const value = Number(amountCell.replace(/[−]/, '-').replace(/[^\d.-]/g, ''));
        if (!Number.isFinite(value) || value === 0) continue;
        const kind: Kind = value < 0 ? 'expense' : 'income';
        const category =
            kind === 'income' ? 'salary' : (CATEGORY_WORDS.find(([, words]) => words.test(label))?.[0] ?? 'groceries');
        out.push({ label, amount: Math.round(Math.abs(value) * 100), kind, category, tags: [], recurring: false });
    }
    return out;
}

/** A bank statement in three steps: choose the file, check what was found, and done. */
function ImportDialog({
    open,
    onOpenChange,
    onImport,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (rows: Omit<Entry, 'id'>[], from: string) => void;
}) {
    const [step, setStep] = useState(0);
    const [found, setFound] = useState<{ rows: Omit<Entry, 'id'>[]; from: string } | null>(null);
    const [problem, setProblem] = useState<string>();

    const read = (text: string, from: string) => {
        const rows = parseStatement(text);
        if (rows.length === 0) return setProblem(`No rows with an amount in ${from}.`);
        setProblem(undefined);
        setFound({ rows, from });
        setStep(1);
    };
    const close = () => {
        onOpenChange(false);
        setStep(0);
        setFound(null);
        setProblem(undefined);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => (o ? onOpenChange(true) : close())}
            title="Import a statement"
            description="Entries from your bank's CSV, added to this month."
        >
            <Stepper value={step} className="my-2">
                <Step>Upload</Step>
                <Step>Review</Step>
                <Step>Done</Step>
            </Stepper>
            {step === 0 && (
                <div className="flex flex-col gap-3">
                    <FileDrop
                        accept=".csv,text/csv"
                        onFiles={([file]) => file.text().then((text) => read(text, file.name))}
                    >
                        <span className="text-foreground font-medium">Drop a statement here</span>
                        <span className="text-xs">A CSV file, or click to choose one</span>
                    </FileDrop>
                    {problem && <FormMessage tone="error">{problem}</FormMessage>}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="self-center"
                        onClick={() => read(SAMPLE_STATEMENT, 'the sample')}
                    >
                        Use a sample statement
                    </Button>
                </div>
            )}
            {step === 1 && found && (
                <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground mt-0! text-sm">
                        {found.rows.length} entries in {found.from}:
                    </p>
                    <ul className="border-tint/10 flex max-h-56 flex-col overflow-y-auto rounded-lg border">
                        {found.rows.map((e, i) => (
                            <li
                                key={i}
                                className="border-tint/[0.07] flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-b-0"
                            >
                                <span className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">{e.label}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {categoryOf(e.category).label}
                                    </span>
                                </span>
                                <span className={e.kind === 'income' ? 'text-primary tabular-nums' : 'tabular-nums'}>
                                    {e.kind === 'income' ? '+' : '−'}
                                    {money(e.amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setStep(0)}>
                            Back
                        </Button>
                        <Button
                            onClick={() => {
                                onImport(found.rows, found.from);
                                setStep(3);
                            }}
                        >
                            Import {found.rows.length} entries
                        </Button>
                    </div>
                </div>
            )}
            {step === 3 && (
                <div className="flex flex-col gap-3">
                    <p className="mt-0! text-sm">{found?.rows.length} entries added to this month.</p>
                    <Button className="self-end" onClick={close}>
                        Done
                    </Button>
                </div>
            )}
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
