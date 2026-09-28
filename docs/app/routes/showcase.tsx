import BudgetApp from '../../../packages/showcase/examples/BudgetApp';

export const meta = () => [
    { title: 'Showcase · Zen' },
    { name: 'description', content: 'A small budget app built only from Zen components.' },
];

export default function Showcase() {
    return <BudgetApp nav={false} />;
}
