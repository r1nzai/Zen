import { Breadcrumb, Breadcrumbs } from '@rinzai/zen';

/** Parents as links (with a router, Breadcrumb asChild around its Link), then the current page. */
export default function Default() {
    return (
        <Breadcrumbs>
            <Breadcrumb href="#">Budgets</Breadcrumb>
            <Breadcrumb href="#">2026</Breadcrumb>
            <Breadcrumb current>September</Breadcrumb>
        </Breadcrumbs>
    );
}
