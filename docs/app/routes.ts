import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
    index('routes/home.tsx'),
    route('showcase', 'routes/showcase.tsx'),
    route('showcase/music', 'routes/showcase-music.tsx'),
    route('components/:slug', 'routes/component.tsx'),
    route('sitemap.xml', 'routes/sitemap.ts'),
    route('llms.txt', 'routes/llms.ts'),
    route('llms-full.txt', 'routes/llms-full.ts'),
    route('docs/:file', 'routes/markdown.ts'),
    route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
