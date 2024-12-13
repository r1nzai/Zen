export default {
    stories: ['../packages/**/*.stories.@(ts|tsx)'],

    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-themes',
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
