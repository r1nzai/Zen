import { cx } from '@zen/utils/cx';
import { useToastHost } from '@zen/toast';
import { useGraphicsMode } from '@zen/utils/graphics';
import { ComponentProps, ReactNode, RefObject, useEffect, useId, useRef } from 'react';

/**
 * Modal dialog on the native <dialog> element: focus is trapped and restored,
 * the page behind is inert, and Escape closes it. `dismissible={false}` is for
 * flows the user must finish (no Escape or outside-click close).
 */
export default function Dialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    dismissible = true,
    initialFocus,
    size = 'md',
    className,
    role,
}: DialogProps) {
    useGraphicsMode();
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descriptionId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            // Whether the page shows a scrollbar, measured before opening hides it (see theme.css).
            const root = document.documentElement;
            root.toggleAttribute('data-zen-scrollbar', window.innerWidth > root.clientWidth);
            dialog.showModal();
            initialFocus?.current?.focus();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open, initialFocus]);
    // While open, toasts render in here: outside a modal dialog they'd be inert.
    useToastHost(ref, open);

    return (
        <dialog
            ref={ref}
            role={role}
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className={cx(
                'zen__dialog glass glass-blur glow-edge text-card-foreground',
                'bg-card/90! m-auto max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] overflow-visible rounded-xl p-0',
                size === 'lg' ? 'w-[60rem]' : 'w-[28rem]',
                'backdrop:bg-black/50 backdrop:backdrop-blur-sm pointer-coarse:backdrop:backdrop-blur-none',
                className,
            )}
            onCancel={(e) => {
                // Escape: keep our `open` prop the source of truth.
                e.preventDefault();
                if (dismissible) onOpenChange?.(false);
            }}
            onClick={(e) => {
                // Only the backdrop hits the <dialog> itself; the content fills it edge to edge.
                if (e.target === e.currentTarget && dismissible) onOpenChange?.(false);
            }}
        >
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 overflow-x-hidden overflow-y-auto p-6">
                <div className="flex flex-col gap-2">
                    <h2 id={titleId} className="text-lg font-semibold tracking-tight">
                        {title}
                    </h2>
                    {description && (
                        <p id={descriptionId} className="text-muted-foreground mt-0! text-sm leading-5">
                            {description}
                        </p>
                    )}
                </div>
                {children}
            </div>
        </dialog>
    );
}

export interface DialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    dismissible?: boolean;
    /** Element to focus when the dialog opens (default: the first focusable one). */
    initialFocus?: RefObject<HTMLElement | null>;
    /** "lg" for dialogs holding a whole tool rather than a short form. */
    size?: 'md' | 'lg';
    className?: string;
    role?: ComponentProps<'dialog'>['role'];
}
