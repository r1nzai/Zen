import { COMPONENTS } from '../pages';
import { markdownResponse, pageMarkdown } from '../site-markdown';
import type { Route } from './+types/markdown';

/** /docs/<slug>.md: one page as markdown. */
export function loader({ params }: Route.LoaderArgs) {
    const doc = COMPONENTS.find((c) => `${c.slug}.md` === params.file);
    if (!doc) throw new Response('Not found', { status: 404 });
    return markdownResponse(pageMarkdown(doc));
}
