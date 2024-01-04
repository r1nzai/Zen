import { useEffect, useMemo, useState } from 'react';

import Container from '@zen/container';
import Badge, { BadgeProps } from '@zen/badge';
import Popover from '@zen/popover';
import Component from '@zen/component';

const Collapse = <TData,>(props: CollapseProps<TData>) => {
    const {
        items = [],
        children,
        moreItemsLabel = '',
        parentRef,
        data,
        estimator = (_, textWidth) => textWidth + 30,
        font = '12px Inter',
        badgeVariant = 'secondary',
        badgeStyles,
    } = props;
    const [renderItems, setRenderItems] = useState<{
        visible: string[];
        hidden: string[];
    }>({
        visible: items,
        hidden: [],
    });
    const canvasContext = useMemo(() => {
        const canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        if (context) {
            context.font = font;
        }
        return context;
    }, []);
    const recalculateItems = () => {
        const itemList = parentRef?.current;
        if (!itemList) {
            return;
        }
        const itemListWidth = itemList.offsetWidth;
        const visibleItems: string[] = [];
        const hiddenItems: string[] = [];
        const moreItemsLabelLength = estimator(moreItemsLabel, canvasContext!.measureText(moreItemsLabel).width + 10);
        itemsWidth?.reduce((acc, tabWidth, index) => {
            if (acc + tabWidth + moreItemsLabelLength > itemListWidth - 20) {
                hiddenItems.push(items[index]);
            } else {
                visibleItems.push(items[index]);
            }
            return acc + tabWidth;
        }, 0);

        setRenderItems({
            visible: visibleItems,
            hidden: hiddenItems,
        });
    };

    const itemsWidth = useMemo(
        () => items?.map((item) => estimator(item, canvasContext!.measureText(item).width)) ?? [],
        [items],
    );
    useEffect(() => {
        recalculateItems();
    }, [items]);
    useEffect(() => {
        if (!parentRef?.current) return;
        const observer = new ResizeObserver(() => {
            recalculateItems();
        });
        observer.observe(parentRef.current);
        return () => {
            observer.disconnect();
        };
    }, [items]);
    return (
        <>
            {renderItems.visible?.map((item, index) => children(item, index, data?.[index]))}
            {renderItems.hidden?.length > 0 && (
                <Popover
                    trigger="click"
                    content={
                        <Container className="grid max-h-60 grid-flow-row grid-cols-2 gap-3 overflow-auto p-2">
                            {renderItems.hidden.map((section, index) =>
                                children(
                                    section,
                                    renderItems.visible.length + index,
                                    data?.[renderItems.visible.length + index],
                                ),
                            )}
                        </Container>
                    }
                >
                    {(show) => (
                        <Badge className={badgeStyles} key={'more_items_button'} variant={badgeVariant}>
                            <Component tag="p">{`+${renderItems.hidden.length} ${moreItemsLabel}`}</Component>
                        </Badge>
                    )}
                </Popover>
            )}
        </>
    );
};

export default Collapse;
export interface CollapseProps<TData> {
    items: string[];
    data?: TData[];
    children: (item: string, index: number, itemData?: TData) => React.ReactNode;
    moreItemsLabel?: string;
    parentRef?: React.RefObject<HTMLElement>;
    estimator?: (item: string, textWidth: number) => number;
    font?: string;
    badgeVariant?: BadgeProps['variant'];
    badgeStyles?: string;
}
