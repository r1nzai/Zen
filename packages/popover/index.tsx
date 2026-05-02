import { cx } from '@zen/utils/cx';
import { ComponentProps, MouseEvent, useEffect, useId, useRef } from 'react';

export default function Popover(props: PopoverProps) {
    const {
        className,
        content,
        children,
        role = 'tooltip',
        triggerType = 'auto',
        trigger = 'click',
        show,
        setShow,
        ...rest
    } = props;

    const rootId = useId();
    const popoverRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const popoverEl = popoverRef.current;
        if (!popoverEl) return;

        const handleOpen = () => props.onOpen?.();
        const handleClose = () => props.onClose?.();

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
        <>
            <div
                className="z-auto max-w-fit min-w-fit [anchor-name:--zen-anchor]"
                style={{
                    '--zen-anchor': `zen__popover-anchor-${rootId}`,
                }}
                popoverTarget={`zen__popover-${rootId}`}
                popoverTargetAction="toggle"
                onClick={
                    trigger === 'click'
                        ? (e: MouseEvent) => {
                              e.stopPropagation();
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
                role="tooltip"
                popover={triggerType}
                id={`zen__popover-${rootId}`}
                className={cx(
                    'zen__popover border-border bg-background shadow-secondary fixed top-[calc(anchor(bottom)+5px)] z-50 w-fit min-w-max [justify-self:anchor-center] rounded border [position-anchor:--zen-anchor] [position-area:block-end_center]',
                    className,
                )}
            >
                {content}
            </div>
        </>
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
