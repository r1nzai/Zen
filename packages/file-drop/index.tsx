import { cx } from '@zen/utils/cx';
import { ComponentProps, DragEvent, ReactNode, useRef, useState } from 'react';

/**
 * Somewhere to drop files, or click (or press Enter) to choose them: it lights
 * up while files are dragged over it. `onFiles` gets those that `accept` allows
 * (one, unless `multiple`). Children are what it says, e.g. "Drop a CSV here".
 */
export default function FileDrop({
    onFiles,
    accept,
    multiple = false,
    disabled = false,
    className,
    children,
    ...rest
}: FileDropProps) {
    const input = useRef<HTMLInputElement>(null);
    const [over, setOver] = useState(false);
    // dragenter and dragleave fire for every child crossed: count them.
    const depth = useRef(0);

    const take = (files: File[]) => {
        const allowed = files.filter((f) => accepts(f, accept)).slice(0, multiple ? undefined : 1);
        if (allowed.length) onFiles(allowed);
    };
    const dragging = (e: DragEvent) => !disabled && e.dataTransfer.types.includes('Files');

    return (
        <label
            {...rest}
            data-over={over || undefined}
            onDragEnter={(e) => {
                if (!dragging(e)) return;
                e.preventDefault();
                depth.current++;
                setOver(true);
            }}
            onDragOver={(e) => {
                if (!dragging(e)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }}
            onDragLeave={() => {
                if (--depth.current <= 0) {
                    depth.current = 0;
                    setOver(false);
                }
            }}
            onDrop={(e) => {
                if (!dragging(e)) return;
                e.preventDefault();
                depth.current = 0;
                setOver(false);
                take([...e.dataTransfer.files]);
            }}
            className={cx(
                'zen__file-drop glow-edge text-muted-foreground relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm',
                'border-tint/15 bg-tint/[0.02] transition-[border-color,background-color,box-shadow,color] duration-200',
                'hover:border-tint/25 hover:text-foreground has-[input:focus-visible]:border-glow/60 has-[input:focus-visible]:shadow-glow-focus',
                'data-over:border-primary/60 data-over:bg-primary/10 data-over:text-foreground data-over:shadow-[0_0_32px_-8px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]',
                disabled && 'pointer-events-none opacity-50',
                className,
            )}
        >
            <input
                ref={input}
                type="file"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                className="sr-only"
                onChange={(e) => {
                    take([...(e.target.files ?? [])]);
                    // The same file chosen again is a change too.
                    e.target.value = '';
                }}
            />
            {children}
        </label>
    );
}

/** Whether `file` is one an <input accept> value allows: extensions (.csv), types (text/csv) and wildcards (image/*). */
export function accepts(file: File, accept?: string): boolean {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept.split(',').some((rule) => {
        const r = rule.trim().toLowerCase();
        if (r.startsWith('.')) return name.endsWith(r);
        if (r.endsWith('/*')) return type.startsWith(r.slice(0, -1));
        return type === r;
    });
}

export interface FileDropProps extends Omit<ComponentProps<'label'>, 'onDrop'> {
    onFiles: (files: File[]) => void;
    /** As an <input type="file">'s accept: ".csv,.xlsx", "image/*". Dropped files are held to it too. */
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    children?: ReactNode;
}
