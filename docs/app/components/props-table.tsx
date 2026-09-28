import { Badge } from '@rinzai/zen';
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
            <div className="glass overflow-x-auto rounded-xl">
                {props.length ? (
                    <table className="w-full min-w-[36rem] text-left text-sm">
                        <thead>
                            <tr className="text-muted-foreground border-tint/[0.07] border-b text-[0.68rem] tracking-[0.1em] uppercase">
                                <th className="px-4 py-3 font-medium">Prop</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Default</th>
                            </tr>
                        </thead>
                        <tbody className="divide-tint/[0.07] divide-y">
                            {props.map((p) => (
                                <tr key={p.name} className="align-top">
                                    <td className="px-4 py-3">
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
                                    </td>
                                    <td className="px-4 py-3">
                                        <code className="text-primary bg-transparent! p-0! text-xs break-words whitespace-pre-wrap">
                                            {p.type.raw ?? p.type.name}
                                        </code>
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3">
                                        <code className="bg-transparent! p-0! text-xs">
                                            {p.defaultValue?.value ?? '—'}
                                        </code>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-muted-foreground px-4 py-3 text-sm">
                        No props of its own; it accepts the props of the element it renders.
                    </p>
                )}
            </div>
        </section>
    );
}
