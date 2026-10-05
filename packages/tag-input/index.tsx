import { useFieldProps } from '@zen/field';
import XMark from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { FIELD } from '@zen/utils/styles';
import { ClipboardEvent, ComponentProps, KeyboardEvent, useState } from 'react';

/**
 * A field of short values (tags, emails, labels): typing one and pressing
 * Enter or a comma adds it, pasting a list adds each, Backspace in the empty
 * field takes the last one back. Each is removed with its ×. Values are
 * trimmed and kept once.
 */
export default function TagInput({
    value: controlled,
    defaultValue = [],
    onValueChange,
    validate,
    removeLabel = (tag) => `Remove ${tag}`,
    className,
    disabled,
    ...rest
}: TagInputProps) {
    const [own, setOwn] = useState(defaultValue);
    const value = controlled ?? own;
    const [text, setText] = useState('');
    const field = useFieldProps(rest);

    const set = (next: string[]) => {
        if (controlled === undefined) setOwn(next);
        onValueChange?.(next);
    };
    const add = (entries: string[]) => {
        const next = [...value];
        for (const entry of entries.map((e) => e.trim())) {
            if (entry && !next.includes(entry) && (validate?.(entry) ?? true)) next.push(entry);
        }
        if (next.length !== value.length) set(next);
    };

    return (
        <div
            className={cx(
                'zen__tag-input',
                FIELD,
                'flex h-auto min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 py-1.5',
                'has-[input:focus-visible]:border-glow/60 has-[input:focus-visible]:bg-tint/[0.05] has-[input:focus-visible]:shadow-glow-focus has-[input:focus-visible]:[--glow-border-color:transparent]',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
            onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
        >
            {value.map((tag) => (
                <span
                    key={tag}
                    className="zen__tag bg-primary/12 text-foreground inline-flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-xs shadow-[inset_0_0_0_1px_oklch(var(--primary)/0.25)]"
                >
                    {tag}
                    <button
                        type="button"
                        disabled={disabled}
                        aria-label={removeLabel(tag)}
                        onClick={() => set(value.filter((t) => t !== tag))}
                        className="text-muted-foreground hover:text-foreground hover:bg-tint/10 focus-visible:ring-ring/50 touch-target grid size-4 cursor-pointer place-items-center rounded-sm outline-hidden focus-visible:ring-2"
                    >
                        <XMark className="size-3" />
                    </button>
                </span>
            ))}
            <input
                {...rest}
                {...field}
                disabled={disabled}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    rest.onKeyDown?.(e);
                    if (e.defaultPrevented || e.nativeEvent.isComposing) return;
                    if ((e.key === 'Enter' || e.key === ',') && text.trim()) {
                        e.preventDefault();
                        add([text]);
                        setText('');
                    } else if (e.key === 'Backspace' && !text && value.length) {
                        e.preventDefault();
                        setText(value[value.length - 1]);
                        set(value.slice(0, -1));
                    }
                }}
                onBlur={(e) => {
                    rest.onBlur?.(e);
                    if (text.trim()) {
                        add([text]);
                        setText('');
                    }
                }}
                onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                    rest.onPaste?.(e);
                    const pasted = e.clipboardData.getData('text');
                    if (e.defaultPrevented || !/[,\n]/.test(pasted)) return;
                    e.preventDefault();
                    add(pasted.split(/[,\n]/));
                }}
                className="h-7 min-w-24 flex-1 bg-transparent outline-hidden placeholder:text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))]"
            />
        </div>
    );
}

export interface TagInputProps extends Omit<ComponentProps<'input'>, 'value' | 'defaultValue'> {
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Whether an entry may be added (e.g. looks like an email). */
    validate?: (entry: string) => boolean;
    /** The × button's label, for screen readers. */
    removeLabel?: (tag: string) => string;
}
