import { resolve } from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { peerDependencies } from './package.json'

// https://vitejs.dev/config/
export default defineConfig((configEnv) => ({
    plugins: [
        react(),
        dts({
            include: ['components/'],
        }),
    ],
    build: {
        lib: {
            entry: resolve('components', ''),
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
}))
