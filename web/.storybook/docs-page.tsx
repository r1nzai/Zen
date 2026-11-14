import { Controls, Description, DocsContext, Source, Story, Unstyled, useOf } from '@storybook/addon-docs/blocks';
import { useContext } from 'react';

import Badge from '../packages/badge';
import Card from '../packages/card';
import Tabs, { Tab, TabList, TabPanel } from '../packages/tabs';

type DocsStory = ReturnType<React.ContextType<typeof DocsContext>['componentStories']>[number];

/**
 * Autodocs page built from Zen's own components: an aurora title, each story in
 * a glass card with Preview / Code pill tabs, and the props in a card.
 */
export function ZenDocsPage() {
    const context = useContext(DocsContext);
    const { preparedMeta } = useOf('meta', ['meta']);
    let stories = context.componentStories().filter((s) => !s.usesMount);
    // Same rule as Storybook's own page: if any story opts into autodocs, show only those.
    if (stories.some((s) => s.tags?.includes('autodocs')))
        stories = stories.filter((s) => s.tags?.includes('autodocs'));
    const [group, name] = splitTitle(preparedMeta.title);

    return (
        <Unstyled>
            <article className="flex flex-col gap-12 font-sans">
                <header className="flex flex-col gap-3">
                    {group && (
                        <Badge variant="secondary" className="self-start">
                            {group}
                        </Badge>
                    )}
                    <h1 className="text-aurora text-4xl font-semibold tracking-tight lg:text-5xl">{name}</h1>
                    <div className="text-muted-foreground text-lg leading-relaxed [&_p]:mt-0">
                        <Description of="meta" />
                    </div>
                </header>

                {stories.map((story, i) => (
                    <Example key={story.id} story={story} primary={i === 0} />
                ))}

                <section className="flex flex-col gap-4">
                    <h2 id="props" className="text-2xl font-semibold tracking-tight">
                        Props
                    </h2>
                    <Card className="overflow-hidden p-0! [&_.docblock-argstable]:my-0!">
                        <Controls />
                    </Card>
                </section>
            </article>
        </Unstyled>
    );
}

function Example({ story, primary }: { story: DocsStory; primary: boolean }) {
    const description = story.parameters?.docs?.description?.story as string | undefined;
    return (
        <section className="flex flex-col gap-4">
            {!primary && (
                <div className="flex flex-col gap-1">
                    <h3 id={`anchor--${story.id}`} className="text-xl font-semibold tracking-tight">
                        {story.name}
                    </h3>
                    {description && <p className="text-muted-foreground mt-0! text-sm">{description}</p>}
                </div>
            )}
            <Card className="overflow-hidden p-0!">
                <Tabs defaultValue="preview" className="gap-0!">
                    <div className="flex items-center justify-between p-3">
                        <TabList variant="pills">
                            <Tab value="preview">Preview</Tab>
                            <Tab value="code">Code</Tab>
                        </TabList>
                        {primary && <Badge>Interactive</Badge>}
                    </div>
                    <TabPanel value="preview" className="border-tint/[0.07] border-t">
                        <div className="flex min-h-48 items-center justify-center p-10">
                            <Story of={story.moduleExport} __primary={primary} __forceInitialArgs={!primary} />
                        </div>
                    </TabPanel>
                    <TabPanel value="code" className="border-tint/[0.07] border-t [&_.docblock-source]:m-0!">
                        <Source of={story.moduleExport} dark />
                    </TabPanel>
                </Tabs>
            </Card>
        </section>
    );
}

/** "Components/Button" → ["Components", "Button"]. */
function splitTitle(title: string): [string | undefined, string] {
    const parts = title.split('/');
    const name = parts.pop()!;
    return [parts.join(' / ') || undefined, name];
}
