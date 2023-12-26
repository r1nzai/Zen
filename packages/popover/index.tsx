import {
    FloatingPortal,
    autoUpdate,
    flip,
    offset,
    shift,
    useClick,
    useDismiss,
    useFloating,
    useHover,
    useInteractions,
    useRole,
} from '@floating-ui/react';
import Component from '@zen/component';
import Container from '@zen/container';
import { cx } from '@zen/utils/cx';
import { MutableRefObject, useId, useState } from 'react';

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
    const getShow = () => {
        return setShow !== undefined && show !== undefined ? show : __internalShow;
    };
    const getShowSetter = () => {
        return setShow !== undefined && show !== undefined ? setShow : __setInternalShow;
    };
    const { x, y, strategy, refs, context } = useFloating({
        open: getShow(),
        onOpenChange: (open) => {
            getShowSetter()(open);
            if (!open) {
                onClose?.();
            } else {
                onOpen?.();
            }
        },
        middleware: [offset(4), flip(), shift()],
        whileElementsMounted: autoUpdate,
        placement,
    });
    const hover = useHover(context, { enabled: trigger === 'hover' && !disabled, move: false });
    const click = useClick(context, { enabled: trigger === 'click' && !disabled, keyboardHandlers: false });
    const dismiss = useDismiss(context);
    const roleInteraction = useRole(context, { role });
    const { getReferenceProps, getFloatingProps } = useInteractions([
        trigger === 'click' ? click : hover,
        dismiss,
        roleInteraction,
    ]);
    const rootId = useId();
    return (
        <>
            <Component
                tag="a"
                className="z-auto block min-w-max"
                id={`zen__popover-${rootId}`}
                ref={refs.setReference}
                {...getReferenceProps()}
            >
                {children?.(getShow())}
            </Component>
            {getShow() && (
                <FloatingPortal root={refs.reference as MutableRefObject<HTMLElement>} preserveTabOrder>
                    <Container
                        onClick={(e) => e.stopPropagation()}
                        visible={getShow()}
                        role="tooltip"
                        className={cx(
                            'zen__popover z-50 w-full rounded border border-border bg-background shadow-secondary',
                            className,
                        )}
                        ref={refs.setFloating}
                        style={{
                            position: strategy,
                            top: y ?? 0,
                            left: x ?? 0,
                            width: (refs.reference?.current as HTMLElement)?.clientWidth ?? 0,
                        }}
                        {...getFloatingProps()}
                    >
                        {content}
                    </Container>
                </FloatingPortal>
            )}
        </>
    );
};
export default Popover;

export interface PopoverProps {
    placement?: Placement;
    className?: string;
    children?: (show: boolean) => React.ReactNode;
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
