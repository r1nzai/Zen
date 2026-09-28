import { render, screen } from '@testing-library/react';

import Table, { TableBody, TableCell, TableHead, TableHeader, TableRow } from './index';

describe('Table', () => {
    it('is a real table on a glass panel', () => {
        const { container } = render(
            <Table className="min-w-96">
                <TableHeader>
                    <TableRow>
                        <TableHead>Prop</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>size</TableCell>
                    </TableRow>
                </TableBody>
            </Table>,
        );
        expect(container.firstChild).toHaveClass('glass', 'glow-edge', 'overflow-x-auto');
        expect(screen.getByRole('table')).toHaveClass('min-w-96');
        expect(screen.getByRole('columnheader', { name: 'Prop' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'size' })).toBeInTheDocument();
    });
});
