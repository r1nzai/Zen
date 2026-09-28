import '../packages/index.css';

import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { DocsContainer } from '@storybook/addon-docs/blocks';
import addonLinks from '@storybook/addon-links';
import addonThemes, { withThemeByClassName } from '@storybook/addon-themes';
import { definePreview } from '@storybook/react-vite';
import Backdrop from '../packages/backdrop';
import TOPO from '../packages/backdrop/examples/topo.svg';

import { ZenDocsPage } from './docs-page';
import { dark } from './theme';

export default definePreview({
    addons: [addonDocs(), addonLinks(), addonThemes(), addonA11y()],
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
        docs: {
            theme: dark,
            // Component docs built from Zen's own components (see docs-page.tsx).
            page: ZenDocsPage,
            toc: { headingSelector: 'h2, h3', title: 'On this page' },
            // One backdrop behind the whole docs page, so its cards light up like Sora's.
            container: (props: Parameters<typeof DocsContainer>[0]) => (
                <DocsContainer {...props}>
                    <Backdrop topoSrc={TOPO} />
                    {props.children}
                </DocsContainer>
            ),
        },
        options: {
            storySort: {
                order: ['Introduction', 'Showcase', 'Components'],
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        a11y: {
            // Report violations in the a11y panel without failing stories
            test: 'todo',
        },
    },
    decorators: [
        // Sora's backdrop behind every story; `parameters.backdrop: false` for stories that draw their own.
        (Story, { viewMode, parameters }) => (
            <>
                {viewMode === 'story' && parameters.backdrop !== false && <Backdrop topoSrc={TOPO} />}
                <Story />
            </>
        ),
        withThemeByClassName({
            themes: {
                dark: 'dark',
                light: 'light',
            },
            defaultTheme: 'dark',
        }),
    ],
});
