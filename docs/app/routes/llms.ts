import { markdownResponse, siteIndex } from '../site-markdown';

/** /llms.txt: what Zen is, how to set it up, and a link to each page as markdown. */
export function loader() {
    return markdownResponse(siteIndex());
}
