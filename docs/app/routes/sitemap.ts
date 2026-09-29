import { ROUTES } from '../pages';
import { SITE } from '../seo';

/** /sitemap.xml, prerendered from the same page list the build renders. */
export function loader() {
    const lastmod = new Date().toISOString().slice(0, 10);
    const urls = ROUTES.filter((path) => path !== '/sitemap.xml')
        .map((path) => `  <url><loc>${SITE}${path}</loc><lastmod>${lastmod}</lastmod></url>`)
        .join('\n');
    return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
    );
}
