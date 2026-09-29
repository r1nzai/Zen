import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
    stories: ['../packages/**/*.mdx', '../packages/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-links', '@storybook/addon-themes', '@storybook/addon-a11y'],
    framework: '@storybook/react-vite',
    // favicon.svg here replaces Storybook's own (a copy of docs/public/favicon.svg).
    staticDirs: ['./public'],
    typescript: {
        reactDocgen: 'react-docgen-typescript',
    },
    // The root Vite config also builds the library's type declarations and stylesheets; Storybook doesn't need them.
    viteFinal: (config) => ({
        ...config,
        plugins: config.plugins
            ?.flat()
            .filter((p) => !(p && typeof p === 'object' && 'name' in p && /dts|zen-stylesheets/.test(p.name))),
    }),
});
