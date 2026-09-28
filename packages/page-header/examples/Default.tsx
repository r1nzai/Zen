import { buttonVariants, PageHeader } from '@rinzai/zen';

export default function Default() {
    return (
        <PageHeader eyebrow="Budget" title="Month overview" lead="Where your money went in September, and what's left.">
            <div className="flex gap-3">
                <a href="#add" className={buttonVariants()}>
                    Add entry
                </a>
                <a href="#export" className={buttonVariants({ variant: 'outline' })}>
                    Export
                </a>
            </div>
        </PageHeader>
    );
}
