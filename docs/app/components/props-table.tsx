import { Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@rinzai/zen';
import type { ComponentType } from 'react';

import { type DocgenInfo, sortedProps, typeText } from '../markdown';
import { DocText } from './doc-text';

/** Props of one component, from its TypeScript types and JSDoc (attached at build time as __docgenInfo). */
export function PropsTable({
    name,
    component,
}: {
    name: string;
    component: ComponentType & { __docgenInfo?: DocgenInfo };
}) {
    const info = component.__docgenInfo;
    const props = sortedProps(info);
    return (
        <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h3 id={`api-${name.toLowerCase()}`} className="font-mono text-base">
                    {'<'}
                    {name}
                    {'>'}
                </h3>
                {info?.description && <DocText text={info.description} className="mt-0! text-sm leading-6" />}
            </div>
            {props.length ? (
                <TableContainer>
                    <Table className="min-w-[36rem]">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Prop</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Default</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {props.map((p) => (
                                <TableRow key={p.name}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <code className="text-foreground bg-transparent! p-0! text-[13px]">
                                                {p.name}
                                            </code>
                                            {p.required && <Badge variant="outline">Required</Badge>}
                                        </div>
                                        {p.description && (
                                            <DocText text={p.description} className="mt-1! text-xs leading-5" />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-primary bg-transparent! p-0! text-xs break-words whitespace-pre-wrap">
                                            {typeText(p.type)}
                                        </code>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        <code className="bg-transparent! p-0! text-xs">
                                            {p.defaultValue?.value ?? '—'}
                                        </code>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <p className="glass glow-edge text-muted-foreground mt-0! rounded-xl px-4 py-3 text-sm">
                    No props of its own; it accepts the props of the element it renders.
                </p>
            )}
        </section>
    );
}
