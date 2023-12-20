import { resolve } from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import tsConfigPaths from 'vite-tsconfig-paths'
import { peerDependencies } from './package.json'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import tailwindcss from "tailwindcss"
export default defineConfig({
    plugins: [
        react(),
        tsConfigPaths(),
        cssInjectedByJs(),
        dts({
            include: ['packages/'],
        }),
    ],
    css: {
        postcss: {
            plugins: [tailwindcss],
        },
    },

    build: {
        lib: {
            entry: resolve('packages', 'index.ts'),
            name: 'Zen',
            formats: ['es', 'umd'],
            fileName: (format) => `zen.${format}.js`,
        },
        rollupOptions: {
            external: [...Object.keys(peerDependencies)],
            output: {
                globals: {
                    react: 'React',
                },
            },
        },
    },
})
