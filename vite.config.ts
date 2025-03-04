import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    plugins: [
        react(),
        tsConfigPaths(),
        tailwindcss(),
        dts({
            insertTypesEntry: true,
            include: ['packages/'],
            exclude: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts', '**/*.spec.tsx', '**/*.spec.ts'],
        }),
    ],

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
