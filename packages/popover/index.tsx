import { cx } from '@zen/utils/cx';
import { useGraphicsMode } from '@zen/utils/graphics';
import { POPUP } from '@zen/utils/styles';
import { ComponentProps, MouseEvent, useEffect, useId, useRef, useState } from 'react';

export default function Popover(props: PopoverProps) {
    const {
        className,
        content,
        children,
        role = 'tooltip',
        triggerType = 'auto',
        trigger = 'click',
        gap = '5px',
        triggerClassName,
        show,
        setShow,
        style,
        onOpen,
        onClose,
        ...rest
    } = props;

    // useId is stable between server and client renders; strip characters invalid in CSS idents
    const rootId = useId().replace(/[^\w-]/g, '');

    useGraphicsMode();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const popoverEl = popoverRef.current;
        if (!popoverEl) return;

        // The browser's toggle event covers every way it opens or closes (click, Escape, light dismiss).
        const handleToggle = (e: Event) => {
            const open = (e as ToggleEvent).newState === 'open';
            setIsOpen(open);
            if (open) onOpen?.();
            else onClose?.();
        };
        popoverEl.addEventListener('toggle', handleToggle);
        return () => popoverEl.removeEventListener('toggle', handleToggle);
    }, [onOpen, onClose]);

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
                className={cx('max-w-fit min-w-fit', triggerClassName)}
                style={
                    {
                        anchorName: `--zen-popover-anchor-${rootId}`,
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
                    'zen__popover fixed z-50 w-[anchor-size(width)] min-w-max [justify-self:anchor-center] overflow-visible p-0 [position-area:block-end_center]',
                    POPUP,
                    className,
                )}
                style={
                    {
                        ...style,
                        '--gap': gap,
                        top: `calc(anchor(bottom) + var(--gap))`,
                        left: `calc(anchor(center) - 50%)`,
                        positionAnchor: `--zen-popover-anchor-${rootId}`,
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
    /** Classes for the element wrapping `children` (it fits its content by default). */
    triggerClassName?: string;
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
