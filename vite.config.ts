import { resolve } from 'node:path'

import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import * as packageJson from './package.json'

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
            name: 'ZenUI',
            formats: ['es', 'umd'],
            fileName: (format) => `zen-ui.${format}.js`,
        },
        rollupOptions: {
            external: [...Object.keys(packageJson.peerDependencies)],
            output: {
                globals: {
                    react: 'React',
                },
            },
        },
    },
}))
