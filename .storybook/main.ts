import { defineMain } from '@storybook/react-vite/node';

export default defineMain({
    stories: ['../packages/**/*.mdx', '../packages/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-links', '@storybook/addon-themes', '@storybook/addon-a11y'],
    framework: '@storybook/react-vite',
    typescript: {
        reactDocgen: 'react-docgen-typescript',
    },
    // The root Vite config also builds the library's type declarations; Storybook doesn't need them.
    viteFinal: (config) => ({
        ...config,
        plugins: config.plugins?.flat().filter((p) => !(p && typeof p === 'object' && 'name' in p && /dts/.test(p.name))),
    }),
});
