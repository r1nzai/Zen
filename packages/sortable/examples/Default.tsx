import { Meter, SortableHandle, SortableItem, SortableList } from '@rinzai/zen';
import { useState } from 'react';

const BUDGETS: Record<string, { name: string; spent: number; limit: number }> = {
    rent: { name: 'Rent', spent: 1800, limit: 1800 },
    groceries: { name: 'Groceries', spent: 412, limit: 500 },
    transport: { name: 'Transport', spent: 64, limit: 120 },
    dining: { name: 'Eating out', spent: 188, limit: 150 },
    fun: { name: 'Fun', spent: 40, limit: 100 },
};

/** Drag a budget by its grip to put them in your order (or Tab to a grip, Space, arrows, Space). */
export default function Default() {
    const [order, setOrder] = useState(Object.keys(BUDGETS));
    return (
        <SortableList value={order} onChange={setOrder} aria-label="Budgets" className="w-full max-w-md gap-2">
            {order.map((id) => {
                const b = BUDGETS[id];
                return (
                    <SortableItem
                        key={id}
                        id={id}
                        className="glass glow-edge flex items-center gap-2 rounded-xl py-2 pr-4 pl-1.5"
                    >
                        <SortableHandle id={id} label={b.name} />
                        <Meter
                            label={b.name}
                            value={b.spent}
                            max={b.limit}
                            detail={`$${b.spent} / $${b.limit}`}
                            className="flex-1"
                        />
                    </SortableItem>
                );
            })}
        </SortableList>
    );
}
