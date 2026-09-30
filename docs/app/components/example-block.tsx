import { Card, Tab, TabList, TabPanel, Tabs } from '@rinzai/zen';

import type { Example } from '../examples';
import { CodeBlock } from './code-block';
import { DocText } from './doc-text';

/** One example: the live component, and its source, in a glass card. */
export function ExampleBlock({ example, heading = true }: { example: Example; heading?: boolean }) {
    const { Component } = example;
    const id = example.name.toLowerCase();
    return (
        <section className="flex flex-col gap-3">
            {heading && (
                <div className="flex flex-col gap-1">
                    <h3 id={id} className="text-lg">
                        <a href={`#${id}`} className="hover:text-primary">
                            {example.title}
                        </a>
                    </h3>
                    {example.description && <DocText text={example.description} className="mt-0! text-sm leading-6" />}
                </div>
            )}
            <Card className="overflow-hidden p-0!">
                <Tabs defaultValue="preview" className="gap-0!">
                    <div className="border-tint/[0.07] border-b p-3">
                        <TabList variant="pills">
                            <Tab value="preview">Preview</Tab>
                            <Tab value="code">Code</Tab>
                        </TabList>
                    </div>
                    <TabPanel value="preview">
                        <div className="flex min-h-56 items-center justify-center p-6 md:p-10">
                            <Component />
                        </div>
                    </TabPanel>
                    <TabPanel value="code">
                        <CodeBlock variant="plain" code={example.source} className="max-h-[32rem] overflow-y-auto" />
                    </TabPanel>
                </Tabs>
            </Card>
        </section>
    );
}
