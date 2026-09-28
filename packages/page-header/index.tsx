import { cx } from '@zen/utils/cx';
import { ReactNode } from 'react';

/** Top of a page: a small eyebrow label, the title in the aurora gradient, and a lead paragraph. */
export default function PageHeader({ eyebrow, title, lead, children, className }: PageHeaderProps) {
    return (
        <header className={cx('zen__page-header flex flex-col gap-3', className)}>
            {eyebrow && <p className="text-muted-foreground mt-0! text-xs tracking-[0.1em] uppercase">{eyebrow}</p>}
            <h1 className="text-aurora text-4xl font-semibold tracking-tight lg:text-5xl">{title}</h1>
            {lead && <p className="text-muted-foreground mt-0! max-w-2xl text-lg leading-relaxed">{lead}</p>}
            {children}
        </header>
    );
}

export interface PageHeaderProps {
    eyebrow?: ReactNode;
    title: ReactNode;
    lead?: ReactNode;
    /** Anything after the lead, e.g. a row of buttons. */
    children?: ReactNode;
    className?: string;
}
