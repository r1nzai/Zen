import { copyFileSync, writeFileSync } from 'node:fs';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin, lazyPlugins } from 'vite-plus';
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
    lint: {
        plugins: ['oxc', 'typescript', 'unicorn', 'react'],
        categories: {
            correctness: 'warn',
        },
        env: {
            builtin: true,
            browser: true,
        },
        settings: {
            react: {
                version: '19.3',
            },
        },
        ignorePatterns: ['node_modules/**/*', 'dist/*'],
        rules: {
            'constructor-super': 'error',
            'for-direction': 'error',
            'getter-return': 'error',
            'no-async-promise-executor': 'error',
            'no-case-declarations': 'error',
            'no-class-assign': 'error',
            'no-compare-neg-zero': 'error',
            'no-cond-assign': 'error',
            'no-const-assign': 'error',
            'no-constant-binary-expression': 'error',
            'no-constant-condition': 'error',
            'no-control-regex': 'error',
            'no-debugger': 'error',
            'no-delete-var': 'error',
            'no-dupe-class-members': 'error',
            'no-dupe-else-if': 'error',
            'no-dupe-keys': 'error',
            'no-duplicate-case': 'error',
            'no-empty': 'error',
            'no-empty-character-class': 'error',
            'no-empty-pattern': 'error',
            'no-empty-static-block': 'error',
            'no-ex-assign': 'error',
            'no-extra-boolean-cast': 'error',
            'no-fallthrough': 'error',
            'no-func-assign': 'error',
            'no-global-assign': 'error',
            'no-import-assign': 'error',
            'no-invalid-regexp': 'error',
            'no-irregular-whitespace': 'error',
            'no-loss-of-precision': 'error',
            'no-misleading-character-class': 'error',
            'no-new-native-nonconstructor': 'error',
            'no-nonoctal-decimal-escape': 'error',
            'no-obj-calls': 'error',
            'no-prototype-builtins': 'error',
            'no-redeclare': 'error',
            'no-regex-spaces': 'error',
            'no-self-assign': 'error',
            'no-setter-return': 'error',
            'no-shadow-restricted-names': 'error',
            'no-sparse-arrays': 'error',
            'no-this-before-super': 'error',
            'no-unassigned-vars': 'error',
            'no-undef': 'error',
            'no-unexpected-multiline': 'error',
            'no-unreachable': 'error',
            'no-unsafe-finally': 'error',
            'no-unsafe-negation': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unused-labels': 'error',
            'no-unused-private-class-members': 'error',
            'no-unused-vars': 'error',
            'no-useless-assignment': 'error',
            'no-useless-backreference': 'error',
            'no-useless-catch': 'error',
            'no-useless-escape': 'error',
            'no-with': 'error',
            'preserve-caught-error': 'error',
            'require-yield': 'error',
            'use-isnan': 'error',
            'valid-typeof': 'error',
            'no-array-constructor': 'error',
            'no-unused-expressions': 'error',
            'react/display-name': 'error',
            'react/jsx-key': 'error',
            'react/jsx-no-comment-textnodes': 'error',
            'react/jsx-no-duplicate-props': 'error',
            'react/jsx-no-target-blank': 'error',
            'react/jsx-no-undef': 'error',
            'react/no-children-prop': 'error',
            'react/no-danger-with-children': 'error',
            'react/no-direct-mutation-state': 'error',
            'react/no-find-dom-node': 'error',
            'react/no-is-mounted': 'error',
            'react/no-render-return-value': 'error',
            'react/no-string-refs': 'error',
            'react/no-unescaped-entities': 'error',
            'react/no-unknown-property': 'error',
            'react/no-unsafe': 'off',
            'react/require-render-return': 'error',
            'typescript/ban-ts-comment': 'error',
            'typescript/no-duplicate-enum-values': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-extra-non-null-assertion': 'error',
            'typescript/no-misused-new': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-non-null-asserted-optional-chain': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-this-alias': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-declaration-merging': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'typescript/no-wrapper-object-types': 'error',
            'typescript/prefer-as-const': 'error',
            'typescript/prefer-namespace-keyword': 'error',
            'typescript/triple-slash-reference': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error',
        },
        overrides: [
            {
                files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
                rules: {
                    'constructor-super': 'off',
                    'getter-return': 'off',
                    'no-class-assign': 'off',
                    'no-const-assign': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-keys': 'off',
                    'no-func-assign': 'off',
                    'no-import-assign': 'off',
                    'no-new-native-nonconstructor': 'off',
                    'no-obj-calls': 'off',
                    'no-redeclare': 'off',
                    'no-setter-return': 'off',
                    'no-this-before-super': 'off',
                    'no-undef': 'off',
                    'no-unreachable': 'off',
                    'no-unsafe-negation': 'off',
                    'no-var': 'error',
                    'no-with': 'off',
                    'prefer-const': 'error',
                    'prefer-rest-params': 'error',
                    'prefer-spread': 'error',
                },
            },
            {
                files: ['**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)', '**/*.story.@(ts|tsx|js|jsx|mjs|cjs)'],
                rules: {
                    'storybook/await-interactions': 'error',
                    'storybook/context-in-play-function': 'error',
                    'storybook/default-exports': 'error',
                    'storybook/hierarchy-separator': 'warn',
                    'storybook/no-redundant-story-name': 'warn',
                    'storybook/no-renderer-packages': 'error',
                    'storybook/prefer-pascal-case': 'warn',
                    'storybook/story-exports': 'error',
                    'storybook/use-storybook-expect': 'error',
                    'storybook/use-storybook-testing-library': 'error',
                    'import/no-anonymous-default-export': 'off',
                    'react/rules-of-hooks': 'off',
                },
                jsPlugins: ['eslint-plugin-storybook'],
                plugins: ['import'],
            },
            {
                files: ['.storybook/main.@(js|cjs|mjs|ts)'],
                rules: {
                    'storybook/no-uninstalled-addons': 'error',
                },
                jsPlugins: ['eslint-plugin-storybook'],
            },
        ],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin',
            },
        ],
    },
    fmt: {
        tabWidth: 4,
        printWidth: 120,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        sortPackageJson: false,
        sortTailwindcss: {},
        ignorePatterns: [],
    },
    plugins: lazyPlugins(() => [
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
    ]),
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
