import { create } from 'storybook/theming';

import { version } from '../package.json';

// Sora's palette (packages/variables.css), converted from OKLCH to sRGB for Storybook's chrome.
const fontBase = '"Inter Variable", Inter, ui-sans-serif, system-ui, sans-serif';
const fontCode = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const shared = {
    fontBase,
    fontCode,
    // Rendered as HTML: the name, then the current version, muted.
    brandTitle: `Zen <span style="margin-left:6px;font:500 11px ui-monospace,monospace;opacity:.55">v${version}</span>`,
    brandUrl: '/',
    brandTarget: '_self',
    appBorderRadius: 10, // --radius: 0.625rem
    inputBorderRadius: 8, // rounded-lg
} as const;

export const dark = create({
    ...shared,
    base: 'dark',
    colorPrimary: '#ab93ed', // --primary
    colorSecondary: '#ab93ed',

    appBg: '#0d0b12', // --background
    appContentBg: '#0d0b12',
    appHoverBg: '#1e1d24', // --muted
    appPreviewBg: '#0d0b12',
    appBorderColor: '#292732', // --border

    textColor: '#f5f5f8', // --foreground
    textInverseColor: '#100d1b', // --primary-foreground
    textMutedColor: '#a5a2b1', // --muted-foreground

    barBg: '#15141b', // --card
    barTextColor: '#a5a2b1',
    barHoverColor: '#f5f5f8',
    barSelectedColor: '#ab93ed',

    buttonBg: '#19171e', // --popover
    buttonBorder: '#292732',
    booleanBg: '#15141b',
    booleanSelectedBg: '#2f2943', // --accent
    inputBg: '#15141b',
    inputBorder: '#292732',
    inputTextColor: '#f5f5f8',
});

export const light = create({
    ...shared,
    base: 'light',
    colorPrimary: '#6a39bd',
    colorSecondary: '#6a39bd',

    appBg: '#fafafd',
    appContentBg: '#fafafd',
    appHoverBg: '#f2f1f5',
    appPreviewBg: '#fafafd',
    appBorderColor: '#e1e0e7',

    textColor: '#191721',
    textInverseColor: '#fafafd',
    textMutedColor: '#64616e',

    barBg: '#ffffff',
    barTextColor: '#64616e',
    barHoverColor: '#191721',
    barSelectedColor: '#6a39bd',

    buttonBg: '#ffffff',
    buttonBorder: '#e1e0e7',
    booleanBg: '#f0eff5',
    booleanSelectedBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#e1e0e7',
    inputTextColor: '#191721',
});
