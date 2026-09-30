import {
    Table,
    TableBody,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    TreeCell,
    TreeLabel,
    TreeRow,
    useTree,
} from '@rinzai/zen';

interface Node {
    name: string;
    size: string;
    children?: Node[];
}

const FILES: Node[] = [
    {
        name: 'packages',
        size: '412 kB',
        children: [
            {
                name: 'button',
                size: '6 kB',
                children: [
                    { name: 'index.tsx', size: '2 kB' },
                    { name: 'index.test.tsx', size: '4 kB' },
                ],
            },
            { name: 'table', size: '14 kB', children: [{ name: 'index.tsx', size: '9 kB' }] },
        ],
    },
    { name: 'docs', size: '88 kB', children: [{ name: 'app', size: '80 kB' }] },
    { name: 'package.json', size: '3 kB' },
];

/** Nested data in, visible rows out: useTree handles opening, closing and the animation. Start collapsed with defaultExpanded={false}. */
export default function Basic() {
    const tree = useTree({ items: FILES, getKey: (n) => n.name + n.size, getChildren: (n) => n.children });
    return (
        <TableContainer className="w-full max-w-md">
            <Table {...tree.tableProps}>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead numeric>Size</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tree.rows.map((row) => (
                        <TreeRow key={row.key} row={row} tree={tree}>
                            <TreeCell className={row.hasChildren ? 'font-medium' : undefined}>
                                <TreeLabel row={row} tree={tree}>
                                    {row.item.name}
                                </TreeLabel>
                            </TreeCell>
                            <TreeCell numeric className="text-muted-foreground">
                                {row.item.size}
                            </TreeCell>
                        </TreeRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
