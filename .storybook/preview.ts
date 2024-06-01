import '../packages/variables.css';
import '../packages/index.css';
import { withThemeByClassName } from '@storybook/addon-themes';

export const parameters = {
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    theme: 'light',
};
export const decorators = [
    withThemeByClassName({
        themes: {
            light: 'light',
            dark: 'dark',
        },
        defaultTheme: 'light',
    }),
];
export const tags = ['autodocs'];
