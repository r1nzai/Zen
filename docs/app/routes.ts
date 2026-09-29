import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
    index('routes/home.tsx'),
    route('showcase', 'routes/showcase.tsx'),
    route('components/:slug', 'routes/component.tsx'),
    route('sitemap.xml', 'routes/sitemap.ts'),
] satisfies RouteConfig;
