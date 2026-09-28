import { addons } from 'storybook/manager-api';

import { dark, light } from './theme';

// Sora is dark-first: dark unless the OS asks for light.
const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;

addons.setConfig({
    theme: prefersLight ? light : dark,
    sidebar: {
        showRoots: true,
    },
});
