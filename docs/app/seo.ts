import type { MetaDescriptor } from 'react-router';

import { version } from '../../package.json';

export const SITE = 'https://zen.rinzai.dev';
export const SITE_NAME = 'Zen';
/** Shared social preview (1200×630), in docs/public. */
const IMAGE = `${SITE}/og.png`;

/**
 * Everything a page needs for search and link previews: title, description,
 * canonical URL (trailing slash, as the site serves it), Open Graph and
 * Twitter cards, plus optional structured data.
 */
export function seo({
    title,
    description,
    path,
    jsonLd = [],
}: {
    title: string;
    description: string;
    /** Site path with its trailing slash, e.g. "/components/button/". */
    path: string;
    jsonLd?: object[];
}): MetaDescriptor[] {
    const url = SITE + path;
    return [
        { title },
        { name: 'description', content: description },
        { tagName: 'link', rel: 'canonical', href: url },
        { property: 'og:type', content: path === '/' ? 'website' : 'article' },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:url', content: url },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: IMAGE },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Zen: React components in dark glass' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: IMAGE },
        ...jsonLd.map((data) => ({ 'script:ld+json': data })),
    ];
}

/** The library itself, as structured data (home page). */
export const LIBRARY_LD = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: '@rinzai/zen',
    description:
        'React components in dark glass: translucent surfaces, hairline borders that catch a pointer light, and one accent colour. No runtime dependencies.',
    url: SITE,
    codeRepository: 'https://github.com/r1nzai/Zen',
    programmingLanguage: ['TypeScript', 'React', 'CSS'],
    runtimePlatform: 'Web browser',
    version,
    author: { '@type': 'Person', name: 'rinzai', url: 'https://github.com/r1nzai' },
};

/** Breadcrumbs for a page under Components. */
export const breadcrumbs = (items: { name: string; path: string }[]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: SITE + item.path,
    })),
});
