import type { Config } from '@react-router/dev/config';

import { ROUTES } from './app/pages';

export default {
    // Static site: every page is rendered to HTML at build time, then hydrated.
    ssr: false,
    // /404 is the not-found page; the build copies it to 404.html (it isn't in the sitemap).
    prerender: [...ROUTES, '/sitemap.xml', '/404'],
    future: {
        // Pre-bundle every route's dependencies when the dev server starts, instead of
        // discovering them on first visit (which fails that request and reloads the page).
        unstable_optimizeDeps: true,
    },
} satisfies Config;
