/**
 * Every docs page, as plain data (the build reads it to know what to prerender).
 * `parts` are the exports documented in the props tables; `examples` orders the
 * files in packages/<folder>/examples (unlisted ones follow alphabetically).
 */
export interface ComponentDoc {
    slug: string;
    title: string;
    description: string;
    /** packages/<folder> holding the component and its examples (defaults to slug). */
    folder?: string;
    parts: string[];
    examples?: string[];
}

export const COMPONENTS: ComponentDoc[] = [
    {
        slug: 'actions-menu',
        title: 'Actions Menu',
        description: 'A "⋯" button that opens a short menu of actions for one thing.',
        parts: ['ActionsMenu'],
    },
    {
        slug: 'backdrop',
        title: 'Backdrop',
        description:
            'The page background: aurora glows over contours or dots, and a light that follows the pointer and catches card edges.',
        parts: ['Backdrop'],
        examples: ['Contours', 'Dots'],
    },
    { slug: 'badge', title: 'Badge', description: 'A small label for status, counts and tags.', parts: ['Badge'] },
    {
        slug: 'button',
        title: 'Button',
        description: 'Actions, from the one glowing primary action to quiet ghost buttons.',
        parts: ['Button'],
        examples: ['Variants', 'Sizes', 'Loading'],
    },
    {
        slug: 'card',
        title: 'Card',
        description: 'Glass panels for grouping content, and stats for single figures.',
        parts: ['Card', 'Stat', 'StatRow'],
        examples: ['Goal', 'Stats'],
    },
    {
        slug: 'code-block',
        title: 'Code Block',
        description: 'Code with a copy button; bring your own highlighter for colours.',
        parts: ['CodeBlock'],
        examples: ['Highlighted', 'Plain'],
    },
    {
        slug: 'collapse',
        title: 'Collapse',
        description: 'Shows as many items as fit on one line, and the rest behind "+N".',
        parts: ['Collapse'],
    },
    {
        slug: 'dialog',
        title: 'Dialog',
        description: 'Modal dialogs on the native <dialog> element, and a confirmation for destructive actions.',
        parts: ['Dialog', 'ConfirmDialog'],
        examples: ['Form', 'Confirm'],
    },
    {
        slug: 'dropdown',
        title: 'Dropdown',
        description: 'Searchable single or multiple selection, with optional creation of new items.',
        parts: ['Dropdown'],
        examples: ['SingleSelect', 'MultiSelect'],
    },
    {
        slug: 'header',
        title: 'Header',
        description: 'A sticky glass bar across the top of the page.',
        parts: ['Header'],
    },
    { slug: 'input', title: 'Input', description: 'Text fields in faint glass that glow on focus.', parts: ['Input'] },
    {
        slug: 'nav-pills',
        title: 'Nav Pills',
        description: 'Top navigation with a glowing pill that slides to the current page. Works with any router.',
        parts: ['NavPills', 'NavPill', 'NavPillIndicator'],
    },
    {
        slug: 'page-header',
        title: 'Page Header',
        description: 'Eyebrow, aurora title and lead paragraph for the top of a page.',
        parts: ['PageHeader'],
    },
    {
        slug: 'popover',
        title: 'Popover',
        description: 'Floating glass panels on the native Popover API: tooltips, menus and small forms.',
        parts: ['Popover'],
        examples: ['Tooltip', 'ProfileCard', 'FeedbackForm', 'Settings', 'Controlled'],
    },
    {
        slug: 'progress-ring',
        title: 'Progress Ring',
        description: 'Circular progress with room for a label in the middle.',
        parts: ['ProgressRing'],
    },
    {
        slug: 'segmented',
        title: 'Segmented',
        description: 'A pill row for a few mutually exclusive options.',
        parts: ['Segmented'],
    },
    {
        slug: 'side-nav',
        title: 'Side Nav',
        description: 'Vertical navigation in titled groups, for docs and settings sidebars. Works with any router.',
        parts: ['SideNav', 'SideNavGroup', 'SideNavLink'],
    },
    {
        slug: 'skeleton',
        title: 'Skeleton & Spinner',
        description: 'Placeholders for content on its way.',
        parts: ['Skeleton', 'Spinner'],
        examples: ['LoadingCard', 'WithSpinner'],
    },
    {
        slug: 'table',
        title: 'Table',
        description: 'Plain HTML tables on a glass panel, with hairline rows.',
        parts: ['Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell'],
    },
    {
        slug: 'table-of-contents',
        title: 'Table of Contents',
        description: 'An "On this page" list that highlights the section being read.',
        parts: ['TableOfContents'],
    },
    {
        slug: 'tabs',
        title: 'Tabs',
        description: 'Switch between views, with an underline or a glowing pill that slides to the active tab.',
        parts: ['Tabs', 'TabList', 'Tab', 'TabPanel'],
        examples: ['Underline', 'Pills'],
    },
    { slug: 'textarea', title: 'Textarea', description: 'Multi-line text, styled like Input.', parts: ['TextArea'] },
    {
        slug: 'theme-toggle',
        title: 'Theme Toggle',
        description: 'Switches between the dark and light themes and remembers the choice.',
        parts: ['ThemeToggle', 'ThemeScript'],
    },
    {
        slug: 'toast',
        title: 'Toast',
        description: 'Short messages that confirm an action or report a problem, with an optional action like Undo.',
        parts: ['ToastProvider'],
    },
    { slug: 'toggle', title: 'Toggle', description: 'An on/off switch.', parts: ['Toggle'] },
];

// Trailing slashes throughout: pages are built as <path>/index.html, which Cloudflare serves at
// <path>/ (and Storybook's relative asset paths need its slash too).
export const componentPath = (slug: string) => `/components/${slug}/`;

/** Every URL on the site. */
export const ROUTES = ['/', '/showcase/', ...COMPONENTS.map((c) => componentPath(c.slug))];
