import { copyFileSync, writeFileSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Stylesheets beside zen.css in dist/:
 * - tailwind.css: for Tailwind apps. Zen's theme, plus @source so the app's own
 *   Tailwind build generates the classes Zen's components use (one Tailwind, no clashes).
 * - theme.css + variables.css: what tailwind.css imports.
 * - base.css: the optional app base (page setup, headings, scrollbars), plain CSS.
 */
function stylesheets(): Plugin {
    return {
        name: 'zen-stylesheets',
        apply: 'build',
        closeBundle() {
            for (const file of ['theme.css', 'variables.css', 'base.css'])
                copyFileSync(`packages/${file}`, `dist/${file}`);
            writeFileSync(
                'dist/tailwind.css',
                `/*
 * Zen for Tailwind v4 apps, after Tailwind itself:
 *     @import 'tailwindcss';
 *     @import '@rinzai/zen/tailwind.css';
 */
@import './theme.css';
@source './**/*.js';
`,
            );
        },
    };
}

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        stylesheets(),
        dts({
            insertTypesEntry: true,
            include: ['packages/'],
            exclude: [
                '**/*.stories.tsx',
                '**/examples/**',
                '**/*.test.tsx',
                '**/*.test.ts',
                '**/*.spec.tsx',
                '**/*.spec.ts',
            ],
        }),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.stories.tsx', 'e2e/**'],
        coverage: {
            provider: 'v8',
            include: ['packages/**/*.{ts,tsx}'],
            exclude: [
                'packages/**/*.stories.tsx',
                'packages/**/examples/**',
                'packages/**/index.ts',
                'packages/icons/**',
            ],
        },
    },
    build: {
        lib: {
            entry: './packages/lib.ts',
            name: 'zen',
            formats: ['es'],
            fileName: 'zen',
            cssFileName: 'zen',
        },

        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                // One file per module, so an app's bundler keeps only what it imports: with
                // "sideEffects" in package.json, files whose exports go unused are skipped
                // whole, top-level calls (createContext, class-string constants) included.
                preserveModules: true,
                preserveModulesRoot: 'packages',
                entryFileNames: '[name].js',
                // Components use hooks and browser APIs; mark the modules as client modules for RSC frameworks
                banner: "'use client';",
                globals: {
                    react: 'React',
                },
            },
        },
    },
});
