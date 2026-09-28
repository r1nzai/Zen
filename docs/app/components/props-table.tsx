import { Badge, Table, TableBody, TableCell, TableContainer, TableHead, TableHeader, TableRow } from '@rinzai/zen';
import type { ComponentType } from 'react';

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
                {info?.description && (
                    <p className="text-muted-foreground mt-0! text-sm leading-6">{info.description}</p>
                )}
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
                                            <p className="text-muted-foreground mt-1! text-xs leading-5">
                                                {p.description}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <code className="text-primary bg-transparent! p-0! text-xs break-words whitespace-pre-wrap">
                                            {p.type.raw ?? p.type.name}
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
