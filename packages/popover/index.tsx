import { cx } from '@zen/utils/cx';
import { ComponentProps, MouseEvent, useEffect, useRef, useState } from 'react';

export default function Popover(props: PopoverProps) {
    const {
        className,
        content,
        children,
        role = 'tooltip',
        triggerType = 'auto',
        trigger = 'click',
        gap = '5px',
        show,
        setShow,
        style,
        ...rest
    } = props;

    const rootIdRef = useRef<string | null>(null);
    if (rootIdRef.current === null) {
        rootIdRef.current = crypto.randomUUID();
    }
    const rootId = rootIdRef.current;

    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const popoverEl = popoverRef.current;
        if (!popoverEl) return;

        const handleOpen = () => {
            setIsOpen(true);
            props.onOpen?.();
        };
        const handleClose = () => {
            setIsOpen(false);
            props.onClose?.();
        };

        popoverEl.addEventListener('popover:open', handleOpen);
        popoverEl.addEventListener('popover:close', handleClose);

        return () => {
            popoverEl.removeEventListener('popover:open', handleOpen);
            popoverEl.removeEventListener('popover:close', handleClose);
        };
    }, [props.onOpen, props.onClose]);

    useEffect(() => {
        if (triggerType === 'manual') {
            if (show) {
                popoverRef.current?.showPopover?.();
            } else {
                popoverRef.current?.hidePopover?.();
            }
        }
    }, [show, triggerType]);

    return (
        <div>
            <div
                aria-expanded={isOpen}
                className="max-w-fit min-w-fit"
                style={
                    {
                        'anchor-name': `--zen-popover-anchor-${rootId}`,
                    } as React.CSSProperties
                }
                popoverTarget={`zen__popover-${rootId}`}
                popoverTargetAction="toggle"
                onClick={
                    trigger === 'click'
                        ? (e: MouseEvent) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              switch (triggerType) {
                                  case 'auto':
                                      popoverRef.current?.togglePopover?.();
                                      break;
                                  case 'manual':
                                      setShow?.(!show);
                                      break;
                              }
                          }
                        : undefined
                }
                onMouseEnter={
                    trigger === 'hover'
                        ? (e) => {
                              e.stopPropagation();
                              popoverRef.current?.showPopover?.();
                          }
                        : undefined
                }
                onMouseLeave={
                    trigger === 'hover'
                        ? (e) => {
                              e.stopPropagation();
                              popoverRef.current?.hidePopover?.();
                          }
                        : undefined
                }
            >
                {children}
            </div>
            <div
                {...rest}
                ref={popoverRef}
                role={role}
                popover={triggerType}
                id={`zen__popover-${rootId}`}
                className={cx(
                    'zen__popover border-border bg-background fixed z-50 w-[anchor-size(width)] min-w-max [justify-self:anchor-center] rounded border shadow-md [position-area:block-end_center]',
                    className,
                )}
                style={
                    {
                        ...style,
                        '--gap': gap,
                        top: `calc(anchor(bottom) + var(--gap))`,
                        'position-anchor': `--zen-popover-anchor-${rootId}`,
                    } as React.CSSProperties
                }
            >
                {content}
            </div>
        </div>
    );
}

export interface PopoverProps extends Omit<ComponentProps<'div'>, 'content'> {
    placement?: Placement;
    className?: string;
    children?: React.ReactNode;
    trigger?: 'hover' | 'click';
    triggerType?: 'auto' | 'manual';
    content?: React.ReactNode;
    onOpen?: () => void;
    onClose?: () => void;
    disabled?: boolean;
    show?: boolean;
    setShow?: (show: boolean) => void;
    role?: AriaRole | ComponentRole;
    gap?: string;
}
type AriaRole = 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
type ComponentRole = 'select' | 'label' | 'combobox';
type Placement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'right'
    | 'right-start'
    | 'right-end'
    | 'left'
    | 'left-start'
    | 'left-end';
