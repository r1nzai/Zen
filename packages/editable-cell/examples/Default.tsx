import { EditableCell, formatMoney, Input, MoneyInput } from '@rinzai/zen';
import { useState } from 'react';

/** Click a value (or Tab to it and press Enter) to edit; Enter or blur saves, Escape cancels. */
export default function Default() {
    const [amount, setAmount] = useState<number | null>(1850000);
    const [note, setNote] = useState('Due on the 5th');
    return (
        <div className="grid w-80 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Rent</span>
            <EditableCell
                label={`Rent: ${amount === null ? 'none' : formatMoney(amount, 'INR', 'en-IN')}`}
                editor={(close) => (
                    <MoneyInput
                        compact
                        autoFocus
                        allowEmpty
                        aria-label="Rent"
                        value={amount}
                        currency="INR"
                        locale="en-IN"
                        onChange={(v) => {
                            setAmount(v);
                            close();
                        }}
                        onCancel={close}
                    />
                )}
            >
                {amount === null ? '–' : formatMoney(amount, 'INR', 'en-IN', { showDecimals: false })}
            </EditableCell>
            <span className="text-muted-foreground">Note</span>
            <EditableCell
                label={`Note: ${note}`}
                className="text-left"
                editor={(close) => (
                    <Input
                        autoFocus
                        aria-label="Note"
                        defaultValue={note}
                        className="h-7"
                        onBlur={(e) => {
                            setNote(e.target.value);
                            close();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') close();
                        }}
                    />
                )}
            >
                {note}
            </EditableCell>
        </div>
    );
}
