import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        dts({
            insertTypesEntry: true,
            include: ['packages/'],
            exclude: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
        }),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/*.stories.tsx'],
        coverage: {
            provider: 'v8',
            include: ['packages/**/*.{ts,tsx}'],
            exclude: ['packages/**/*.stories.tsx', 'packages/**/index.ts', 'packages/icons/**'],
        },
    },
    build: {
        lib: {
            entry: './packages/index.ts',
            name: 'zen',
            formats: ['es'],
            fileName: 'zen',
            cssFileName: 'zen',
        },

        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                globals: {
                    react: 'React',
                },
            },
        },
    },
});
