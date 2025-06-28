export default {
    stories: ['../packages/**/*.stories.@(ts|tsx)'],

    addons: [
        '@storybook/addon-links',
        '@storybook/addon-themes',
        '@storybook/addon-docs'
    ],

    framework: {
        name: '@storybook/react-vite',
        options: {},
    },

    docs: {},

    typescript: {
        reactDocgen: 'react-docgen-typescript',
    },
};
