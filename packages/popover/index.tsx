import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import zen from '@zen/zen';
import { cx } from '@zen/utils/cx';
import useClickOutside from '@zen/utils/useClickOutside';
import { MouseEvent, useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

const Popover = (props: PopoverProps): JSX.Element => {
    let {
        className,
        placement = 'bottom-start',
        trigger = 'hover',
        content,
        children,
        onClose,
        onOpen,
        disabled = false,
        show = false,
        setShow,
        role = 'tooltip',
    } = props;
    const [__internalShow, __setInternalShow] = useState(show);
    const actualShow = setShow !== undefined && show !== undefined ? show : __internalShow;
    const actualSetShow = setShow !== undefined && show !== undefined ? setShow : __setInternalShow;
    const { x, y, strategy, refs } = useFloating({
        open: actualShow,
        middleware: [offset(4), flip(), shift()],
        whileElementsMounted: autoUpdate,
        placement,
    });
    const rootId = useId();
    useEffect(() => {
        return useClickOutside(refs.floating, (outside) => {
            if (outside) {
                actualSetShow(false);
            }
        });
    }, []);
    return (
        <>
            <zen.div
                className="z-auto block min-w-max"
                id={`zen__popover-${rootId}`}
                ref={refs.setReference}
                onClick={(e: MouseEvent<HTMLDivElement>) => {
                    if (trigger === 'click') {
                        if (disabled) {
                            return;
                        }
                        if (actualShow) {
                            actualSetShow(false);
                            onClose?.();
                        } else {
                            actualSetShow(true);
                            onOpen?.();
                        }
                    }
                    e.stopPropagation();
                }}
                role={role}
                asChild
            >
                {children}
            </zen.div>
            {actualShow &&
                createPortal(
                    <zen.div
                        onClick={(e) => e.stopPropagation()}
                        visible={actualShow}
                        role="tooltip"
                        className={cx(
                            'zen__popover z-50 w-fit rounded border border-border bg-background shadow-secondary',
                            className,
                        )}
                        ref={refs.setFloating}
                        style={{
                            position: strategy,
                            top: y ?? 0,
                            left: x ?? 0,
                        }}
                    >
                        {content}
                    </zen.div>,
                    document.body,
                )}
        </>
    );
};
export default Popover;

export interface PopoverProps {
    placement?: Placement;
    className?: string;
    children?: React.ReactNode;
    trigger?: 'hover' | 'click';
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
