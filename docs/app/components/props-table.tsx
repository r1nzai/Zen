import { Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@rinzai/zen';
import type { ComponentType } from 'react';

import { DocText } from './doc-text';

interface DocgenProp {
    name: string;
    required: boolean;
    description: string;
    type: { name: string; raw?: string };
    defaultValue?: { value: string } | null;
}
interface DocgenInfo {
    displayName: string;
    description: string;
    props: Record<string, DocgenProp>;
}

/**
 * A prop's type as text. Flat unions are sorted (null and undefined last): the
 * prerender and the client each get types from their own docgen run, which can
 * list union members in different orders and break hydration.
 */
function typeText(type: DocgenProp['type']) {
    const text = type.raw ?? type.name;
    if (!text.includes(' | ') || /[()[\]{}<>]/.test(text)) return text;
    const last = (m: string) => Number(m === 'null' || m === 'undefined');
    return text
        .split(' | ')
        .sort((a, b) => last(a) - last(b) || a.localeCompare(b))
        .join(' | ');
}

/** Props of one component, from its TypeScript types and JSDoc (attached at build time as __docgenInfo). */
export function PropsTable({
    name,
    component,
}: {
    name: string;
    component: ComponentType & { __docgenInfo?: DocgenInfo };
}) {
    const info = component.__docgenInfo;
    const props = Object.values(info?.props ?? {}).sort(
        (a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name),
    );
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
