import { COMPONENTS } from '../pages';
import { markdownResponse, pageMarkdown, siteIndex } from '../site-markdown';

/** /llms-full.txt: the index, then every page in full. */
export function loader() {
    return markdownResponse([siteIndex(), ...COMPONENTS.map(pageMarkdown)].join('\n---\n\n'));
}
