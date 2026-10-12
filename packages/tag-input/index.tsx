import { useMessages } from '@zen/locale-provider';
import { useFieldProps } from '@zen/field';
import XMark from '@zen/icons/micro/x-mark';
import { cx } from '@zen/utils/cx';
import { FormValue } from '@zen/utils/form-value';
import { FIELD } from '@zen/utils/styles';
import { useControllable } from '@zen/utils/useControllable';
import { ClipboardEvent, ComponentProps, KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

/**
 * A field of short values (tags, emails, labels): typing one and pressing
 * Enter or a comma adds it, pasting a list adds each, Backspace in the empty
 * field takes the last one back. Each is removed with its ×. Values are
 * trimmed and kept once. Past about three rows the tags scroll, under a
 * typing line that stays in view (a max-h-* class sets the field's height).
 */
export default function TagInput({
    value: controlled,
    defaultValue = [],
    onValueChange,
    validate,
    removeLabel: removeLabelProp,
    className,
    disabled,
    name,
    ...rest
}: TagInputProps) {
    const m = useMessages();
    const removeLabel = removeLabelProp ?? m.remove;
    const [value, set, reset] = useControllable(controlled, defaultValue, onValueChange);
    const [text, setText] = useState('');
    const field = useFieldProps(rest);
    const tags = useRef<HTMLDivElement>(null);
    const count = value.length;

    // While typing them in, show the newest tags.
    useLayoutEffect(() => {
        const el = tags.current;
        if (el?.parentElement?.contains(document.activeElement)) el.scrollTop = el.scrollHeight;
    }, [count]);

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
                'flex h-auto max-h-36 min-h-10 w-full cursor-text flex-col gap-1.5 py-1.5',
                'has-[input:focus-visible]:border-glow/60 has-[input:focus-visible]:bg-tint/[0.05] has-[input:focus-visible]:shadow-glow-focus has-[input:focus-visible]:[--glow-border-color:transparent]',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
            onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
        >
            {count > 0 && (
                <div ref={tags} className="flex min-h-0 flex-wrap gap-1.5 overflow-y-auto">
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
                                className="text-muted-foreground hover:text-foreground hover:bg-tint/10 touch-target focus-ring grid size-4 cursor-pointer place-items-center rounded-sm outline-hidden"
                            >
                                <XMark className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
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
                className="h-7 w-full shrink-0 bg-transparent outline-hidden placeholder:text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))]"
            />
            <FormValue name={name} value={value} onReset={reset} />
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
    /** Form field name: each tag is submitted under it. */
    name?: string;
}
