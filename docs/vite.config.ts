import { fileURLToPath } from 'node:url';

import reactDocgenTypescript from '@joshwooding/vite-plugin-react-docgen-typescript';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const packages = fileURLToPath(new URL('../packages', import.meta.url));

export default defineConfig({
    plugins: [
        tailwindcss(),
        // Props tables: attaches each component's props (types, defaults, JSDoc) as __docgenInfo.
        reactDocgenTypescript({
            tsconfigPath: fileURLToPath(new URL('../tsconfig.json', import.meta.url)),
            include: ['../packages/*/index.tsx'],
            shouldExtractLiteralValuesFromEnum: true,
            shouldRemoveUndefinedFromOptional: true,
            savePropValueAsString: true,
            // Only Zen's own props, not the hundreds inherited from HTML elements.
            propFilter: (prop) => !prop.parent || !/node_modules/.test(prop.parent.fileName),
        }),
        reactRouter(),
    ],
    resolve: {
        // Docs run on the library's source, so the site always shows the current code.
        alias: [
            { find: /^@rinzai\/zen$/, replacement: `${packages}/index.ts` },
            { find: /^@zen\/(.*)$/, replacement: `${packages}/$1` },
        ],
    },
    server: {
        fs: { allow: ['..'] },
    },
});
