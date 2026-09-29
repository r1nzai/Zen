import BudgetApp from '../../../packages/showcase/examples/BudgetApp';
import { seo } from '../seo';

export const meta = () =>
    seo({
        title: 'Showcase: a budget app built with Zen',
        description:
            'A working budget app built only from Zen components: sortable, editable tables, tree rows with meters, dialogs, pickers and a live theme editor.',
        path: '/showcase/',
    });

export default function Showcase() {
    return <BudgetApp nav={false} />;
}
