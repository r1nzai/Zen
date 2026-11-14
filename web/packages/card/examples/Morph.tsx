import { Button, Card, CardDescription, CardHeader, CardTitle, Sparkline } from '@rinzai/zen';
import { startTransition, useState, ViewTransition } from 'react';

const accounts = [
    { id: 'checking', name: 'Checking', balance: '$4,280.15', trend: [31, 34, 30, 38, 36, 42, 40, 45] },
    { id: 'savings', name: 'Savings', balance: '$12,940.00', trend: [80, 82, 83, 85, 86, 88, 91, 94] },
    { id: 'card', name: 'Credit card', balance: '−$612.40', trend: [12, 18, 15, 22, 27, 21, 30, 26] },
];

export default function Morph() {
    const [open, setOpen] = useState<string | null>(null);
    const go = (id: string | null) => startTransition(() => setOpen(id));
    const account = accounts.find((a) => a.id === open);

    if (account)
        return (
            <ViewTransition name={`account-${account.id}`} share="zen-morph">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>{account.name}</CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => go(null)}>
                            Back
                        </Button>
                    </CardHeader>
                    <p className="text-3xl font-semibold tabular-nums">{account.balance}</p>
                    <CardDescription className="mt-1">Last 8 weeks</CardDescription>
                    <Sparkline values={account.trend} className="mt-4 h-24 w-full" />
                </Card>
            </ViewTransition>
        );

    return (
        <div className="grid w-full max-w-md gap-3">
            {accounts.map((a) => (
                <ViewTransition key={a.id} name={`account-${a.id}`} share="zen-morph">
                    <Card className="p-0 md:p-0">
                        <button
                            type="button"
                            onClick={() => go(a.id)}
                            className="flex w-full items-center justify-between rounded-xl p-4 text-left"
                        >
                            <span className="font-medium">{a.name}</span>
                            <span className="tabular-nums">{a.balance}</span>
                        </button>
                    </Card>
                </ViewTransition>
            ))}
        </div>
    );
}
