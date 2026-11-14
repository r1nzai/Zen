import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

import reactDocgenTypescript from '@joshwooding/vite-plugin-react-docgen-typescript';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, lazyPlugins } from 'vite-plus';

const packages = fileURLToPath(new URL('../web/packages', import.meta.url));

// The Kotlin library's web app and API reference, as Gradle builds them (docs:kotlin); the build copies them in.
const kotlin = {
    '/kotlin/demo/': fileURLToPath(new URL('../kotlin/webApp/build/dist/wasmJs/productionExecutable', import.meta.url)),
    '/kotlin/api/': fileURLToPath(new URL('../kotlin/zen/build/dokka/html', import.meta.url)),
};
const TYPES: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.wasm': 'application/wasm',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain',
};

export default defineConfig({
    plugins: lazyPlugins(() => [
        tailwindcss(),
        // Props tables: attaches each component's props (types, defaults, JSDoc) as __docgenInfo.
        reactDocgenTypescript({
            tsconfigPath: fileURLToPath(new URL('../web/tsconfig.json', import.meta.url)),
            // Every component file: some packages keep parts beside index.tsx (sortable/tree.tsx, chart/donut.tsx).
            include: ['../web/packages/*/*.tsx'],
            exclude: ['../web/packages/*/*.stories.tsx', '../web/packages/*/*.test.tsx'],
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            savePropValueAsString: true,
            // Only Zen's own props, not the hundreds inherited from HTML elements.
            propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
        }),
        // Not under Vitest: the docs' tests are of plain modules, and the router plugin expects a dev server or build.
        ...(process.env.VITEST ? [] : [reactRouter()]),
        {
            name: 'kotlin-builds',
            configureServer(server) {
                server.middlewares.use((req, res, next) => {
                    const path = decodeURI(req.url?.split('?')[0] ?? '');
                    const base = Object.keys(kotlin).find((b) => path.startsWith(b));
                    if (!base) return next();
                    const root = kotlin[base as keyof typeof kotlin];
                    let file = normalize(join(root, path.slice(base.length)));
                    if (!file.startsWith(root)) return next();
                    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
                    if (!existsSync(file)) return next();
                    res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
                    createReadStream(file).pipe(res);
                });
            },
        },
    ]),
    resolve: {
        // Docs run on the library's source, so the site always shows the current code.
        alias: [
            { find: /^@rinzai\/zen$/, replacement: `${packages}/index.ts` },
            { find: /^@zen\/(.*)$/, replacement: `${packages}/$1` },
        ],
    },
    test: { include: ['app/**/*.test.ts'] },
    server: {
        // In this WSL setup `localhost` resolves to ::1 only, which Windows can't reach
        // (it forwards IPv4 loopback). Loopback only: not exposed on the LAN.
        host: '127.0.0.1',
        // Not Vite's default 5173: that's Sora's (pinned there), and the two run side by side.
        port: 5190,
        strictPort: true,
        fs: { allow: ['..'] },
    },
});
