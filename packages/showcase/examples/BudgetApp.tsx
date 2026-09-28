import { useEffect, useMemo, useState } from 'react';

import {
    ActionsMenu,
    Badge,
    Button,
    Card,
    ConfirmDialog,
    Dialog,
    Dropdown,
    type DropdownItem,
    Input,
    NavPill,
    NavPillIndicator,
    NavPills,
    Popover,
    ProgressRing,
    Segmented,
    Skeleton,
    Stat,
    StatRow,
    Tab,
    TabList,
    TabPanel,
    Tabs,
    TextArea,
    ToastProvider,
    Toggle,
    useToast,
} from '@rinzai/zen';

/*
 * Every component working together in one small budget app: open, fill in and
 * submit dialogs, delete with confirm and undo, filter with tabs, and change
 * the glow from the settings card.
 */

type Kind = 'expense' | 'income';

interface Entry {
    id: number;
    label: string;
    amount: number;
    kind: Kind;
    category: DropdownItem;
    tags: DropdownItem[];
    recurring: boolean;
}

const CATEGORIES: DropdownItem[] = ['Salary', 'Rent', 'Groceries', 'Transport', 'Dining out', 'Subscriptions'].map(
    (text) => ({ text, key: text.toLowerCase() }),
);
const TAGS: DropdownItem[] = ['Essential', 'Shared', 'Work', 'Treat', 'Annual'].map((text) => ({
    text,
    key: text.toLowerCase(),
}));
const MONTHS: DropdownItem[] = ['July 2026', 'August 2026', 'September 2026'].map((text) => ({ text, key: text }));

const category = (key: string) => CATEGORIES.find((c) => c.key === key)!;
const tag = (key: string) => TAGS.find((t) => t.key === key)!;

const INITIAL: Entry[] = [
    {
        id: 1,
        label: 'Paycheck',
        amount: 8450,
        kind: 'income',
        category: category('salary'),
        tags: [tag('work')],
        recurring: true,
    },
    {
        id: 2,
        label: 'Rent',
        amount: 1850,
        kind: 'expense',
        category: category('rent'),
        tags: [tag('essential'), tag('shared')],
        recurring: true,
    },
    {
        id: 3,
        label: 'Weekly shop',
        amount: 164,
        kind: 'expense',
        category: category('groceries'),
        tags: [tag('essential')],
        recurring: false,
    },
    {
        id: 4,
        label: 'Train pass',
        amount: 92,
        kind: 'expense',
        category: category('transport'),
        tags: [tag('work')],
        recurring: true,
    },
    {
        id: 5,
        label: 'Dinner with Sam',
        amount: 78,
        kind: 'expense',
        category: category('dining out'),
        tags: [tag('treat')],
        recurring: false,
    },
    {
        id: 6,
        label: 'Music streaming',
        amount: 12,
        kind: 'expense',
        category: category('subscriptions'),
        tags: [],
        recurring: true,
    },
];

const money = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function Budget({ nav }: { nav: boolean }) {
    const toast = useToast();
    const [entries, setEntries] = useState(INITIAL);
    const [month, setMonth] = useState(MONTHS[2]);
    const [adding, setAdding] = useState(false);
    const [deleting, setDeleting] = useState<Entry | null>(null);
    const [resetting, setResetting] = useState(false);
    const [loading, setLoading] = useState(false);

    const income = entries.filter((e) => e.kind === 'income').reduce((sum, e) => sum + e.amount, 0);
    const spent = entries.filter((e) => e.kind === 'expense').reduce((sum, e) => sum + e.amount, 0);

    const refresh = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast('Up to date', { description: `Rates and totals for ${month.text} refreshed.`, tone: 'success' });
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
        <div className="rise mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-10">
            {nav && <AppNav />}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-muted-foreground text-xs tracking-[0.1em] uppercase">Budget</p>
                    <h1 className="text-aurora mt-1 text-4xl">Month overview</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Dropdown items={MONTHS} selected={month} onChange={setMonth} className="w-48" />
                    <Button variant="outline" loading={loading} onClick={refresh}>
                        {loading ? 'Refreshing' : 'Refresh'}
                    </Button>
                    <Button onClick={() => setAdding(true)}>Add entry</Button>
                    <ActionsMenu
                        label="Budget actions"
                        actions={[
                            { label: 'Export CSV', onClick: () => toast('Export started', { tone: 'info' }) },
                            { label: 'Reset month', onClick: () => setResetting(true), destructive: true },
                        ]}
                    />
                </div>
            </header>

            <StatRow>
                {loading ? (
                    [0, 1, 2].map((i) => (
                        <div key={i} className="glass flex flex-col gap-2 rounded-xl p-4">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-28" />
                        </div>
                    ))
                ) : (
                    <>
                        <Stat label="Income" value={money(income)} hint="+4% on last month" />
                        <Stat label="Spent" value={money(spent)} tone="negative" />
                        <Stat
                            label="Net this month"
                            value={money(income - spent)}
                            tone={income >= spent ? 'positive' : 'negative'}
                        />
                    </>
                )}
            </StatRow>

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card title="Entries" action={<Badge variant="secondary">{entries.length} this month</Badge>}>
                    <Tabs defaultValue="all">
                        <TabList variant="pills">
                            <Tab value="all">All</Tab>
                            <Tab value="expense">Expenses</Tab>
                            <Tab value="income">Income</Tab>
                        </TabList>
                        {(['all', 'expense', 'income'] as const).map((filter) => (
                            <TabPanel key={filter} value={filter}>
                                <EntryList
                                    entries={entries.filter((e) => filter === 'all' || e.kind === filter)}
                                    onDelete={setDeleting}
                                />
                            </TabPanel>
                        ))}
                    </Tabs>
                </Card>

                <div className="flex flex-col gap-6">
                    <Goals />
                    <Appearance />
                </div>
            </div>

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
        </div>
    );
}

const PAGES = ['Month', 'Planner', 'Loans', 'Goals', 'Trends'];

/** The app's top bar. A router would set the current page; here clicks just move it. */
function AppNav() {
    const [page, setPage] = useState('Month');
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-lg font-semibold tracking-tight">Zen</span>
            <NavPills aria-label="Main">
                <NavPillIndicator />
                {PAGES.map((p) => (
                    <NavPill
                        key={p}
                        href={`#${p.toLowerCase()}`}
                        active={p === page}
                        onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                        }}
                    >
                        {p}
                    </NavPill>
                ))}
            </NavPills>
        </div>
    );
}

function EntryList({ entries, onDelete }: { entries: Entry[]; onDelete: (entry: Entry) => void }) {
    if (!entries.length) return <p className="text-muted-foreground py-8 text-center text-sm">Nothing here yet.</p>;
    return (
        <ul className="divide-tint/[0.07] -mx-1 flex flex-col divide-y">
            {entries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-1 py-2.5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate text-sm font-medium">{e.label}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-muted-foreground text-xs">{e.category.text}</span>
                            {e.recurring && <Badge variant="outline">Monthly</Badge>}
                            {e.tags.map((t) => (
                                <Badge key={t.key} variant="secondary">
                                    {t.text}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <span className={e.kind === 'income' ? 'text-primary text-glow tabular-nums' : 'tabular-nums'}>
                        {e.kind === 'income' ? '+' : '−'}
                        {money(e.amount)}
                    </span>
                    <ActionsMenu
                        label={`Actions for ${e.label}`}
                        actions={[{ label: 'Delete', onClick: () => onDelete(e), destructive: true }]}
                    />
                </li>
            ))}
        </ul>
    );
}

function Goals() {
    const goals = [
        { name: 'Emergency fund', saved: 6400, target: 10000 },
        { name: 'New laptop', saved: 560, target: 2000 },
    ];
    return (
        <Card title="Goals">
            <div className="flex flex-col gap-4">
                {goals.map((g) => (
                    <div key={g.name} className="flex items-center gap-4">
                        <ProgressRing value={g.saved / g.target} size={64} stroke={6} label={g.name}>
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
            </div>
        </Card>
    );
}

const GLOW = { off: '0', soft: '0.55', bright: '1' } as const;

/** Live controls for the theme's glow, like Sora's appearance settings. */
function Appearance() {
    const [glow, setGlow] = useState<keyof typeof GLOW>('soft');
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--glow-strength', GLOW[glow]);
        root.classList.toggle('reduce-motion', reduceMotion);
        return () => {
            root.style.removeProperty('--glow-strength');
            root.classList.remove('reduce-motion');
        };
    }, [glow, reduceMotion]);

    return (
        <Card
            title="Appearance"
            action={
                <Popover
                    trigger="hover"
                    content={
                        <p className="text-muted-foreground mt-0! max-w-56 p-3 text-xs leading-5">
                            Glow lights focus rings, primary buttons and card edges near the pointer.
                        </p>
                    }
                >
                    <Badge variant="outline">?</Badge>
                </Popover>
            }
        >
            <div className="flex flex-col gap-5">
                <Segmented
                    label="Glow"
                    value={glow}
                    onChange={setGlow}
                    options={[
                        { value: 'off', label: 'Off' },
                        { value: 'soft', label: 'Soft' },
                        { value: 'bright', label: 'Bright' },
                    ]}
                />
                <label className="flex items-center justify-between gap-4">
                    Reduce motion
                    <Toggle checked={reduceMotion} onChange={setReduceMotion} aria-label="Reduce motion" />
                </label>
            </div>
        </Card>
    );
}

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
            amount: '',
            kind: 'expense' as Kind,
            category: CATEGORIES[2],
            tags: [] as DropdownItem[],
            recurring: false,
            note: '',
        }),
        [],
    );
    const [form, setForm] = useState(blank);
    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
        setForm((f) => ({ ...f, [key]: value }));
    const amount = Number(form.amount);
    const valid = form.label.trim() !== '' && amount > 0;

    const close = () => {
        onOpenChange(false);
        setForm(blank);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => (o ? onOpenChange(true) : close())}
            title="Add entry"
            description="Amounts are in US dollars."
        >
            <form
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!valid) return;
                    onAdd({
                        label: form.label.trim(),
                        amount,
                        kind: form.kind,
                        category: form.category,
                        tags: form.tags,
                        recurring: form.recurring,
                    });
                    close();
                }}
            >
                <Segmented
                    label="Type"
                    value={form.kind}
                    onChange={(kind) => set('kind', kind)}
                    options={[
                        { value: 'expense', label: 'Expense' },
                        { value: 'income', label: 'Income' },
                    ]}
                />
                <div className="grid grid-cols-[2fr_1fr] gap-3">
                    <label className="flex flex-col gap-2">
                        Description
                        <Input
                            value={form.label}
                            onChange={(e) => set('label', e.target.value)}
                            placeholder="Weekly shop"
                        />
                    </label>
                    <label className="flex flex-col gap-2">
                        Amount
                        <Input
                            value={form.amount}
                            onChange={(e) => set('amount', e.target.value)}
                            inputMode="decimal"
                            placeholder="0"
                            className="tabular-nums"
                        />
                    </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Category</span>
                        <Dropdown
                            items={CATEGORIES}
                            selected={form.category}
                            onChange={(c) => set('category', c)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">Tags</span>
                        <Dropdown
                            multiple
                            items={TAGS}
                            placeholder="None"
                            selected={form.tags}
                            onChange={(t) => set('tags', t)}
                            className="w-full"
                        />
                    </div>
                </div>
                <label className="flex flex-col gap-2">
                    Note
                    <TextArea value={form.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional" />
                </label>
                <label className="flex items-center justify-between gap-4">
                    Repeats every month
                    <Toggle
                        checked={form.recurring}
                        onChange={(r) => set('recurring', r)}
                        aria-label="Repeats every month"
                    />
                </label>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={close}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!valid}>
                        Add entry
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

/** `nav={false}` drops the app's own top bar, for pages that already have one. */
export default function BudgetApp({ nav = true }: { nav?: boolean }) {
    return (
        <ToastProvider>
            <Budget nav={nav} />
        </ToastProvider>
    );
}
