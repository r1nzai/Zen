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
    /** What the import line shows, when it isn't `parts` (pages about functions rather than components). */
    imports?: string[];
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
        slug: 'animated-number',
        title: 'Animated Number',
        description: 'Numbers and amounts that count smoothly to each new value.',
        parts: ['AnimatedNumber', 'AnimatedMoney'],
    },
    {
        slug: 'avatar',
        title: 'Avatar',
        description:
            "A round picture, or the name's initial on the glowing accent. With an in-browser crop for uploads.",
        parts: ['Avatar'],
        examples: ['Default', 'Upload'],
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
        examples: ['Highlighted', 'Plain', 'InCard'],
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
        examples: ['Form', 'Pickers', 'Confirm'],
    },
    {
        slug: 'dropdown',
        title: 'Dropdown',
        description: 'Searchable single or multiple selection, with optional creation of new items.',
        parts: ['Dropdown'],
        examples: ['SingleSelect', 'MultiSelect', 'ManyItems'],
    },
    {
        slug: 'editable-cell',
        title: 'Editable Cell',
        description: 'A value edited in place: shows the value, swaps in any editor on click or Enter.',
        parts: ['EditableCell'],
    },
    {
        slug: 'field',
        title: 'Field',
        description:
            'A label, hint and error wired to their control for screen readers, and messages for a whole form.',
        parts: ['Field', 'FormMessage'],
    },
    {
        slug: 'header',
        title: 'Header',
        description: 'A sticky glass bar across the top of the page.',
        parts: ['Header'],
    },
    { slug: 'input', title: 'Input', description: 'Text fields in faint glass that glow on focus.', parts: ['Input'] },
    {
        slug: 'input-group',
        title: 'Input Group',
        description: 'A field with slots: put symbols, icons, units, buttons or menus before and after the input.',
        parts: ['InputGroup', 'InputGroupInput', 'InputGroupAddon'],
        examples: ['Default', 'WithButton'],
    },
    {
        slug: 'menu',
        title: 'Menu',
        description: 'A button that opens a menu, with your own trigger, a header, icons, groups and destructive items.',
        parts: ['Menu', 'MenuItem', 'MenuSeparator', 'MenuHeader'],
        examples: ['Account'],
    },
    {
        slug: 'meter',
        title: 'Meter',
        description: 'A measure against a limit, like spend against a budget: warm near it, red past it.',
        parts: ['Meter'],
    },
    {
        slug: 'money-input',
        title: 'Money Input',
        description:
            'Amounts in any currency and locale, with shorthand like 1.5L or 10k, exact to the paisa. Built on Input Group.',
        parts: ['MoneyInput'],
        examples: ['Default', 'Dollars', 'CurrencyMenu', 'Compact'],
    },
    {
        slug: 'month-picker',
        title: 'Month Picker',
        description:
            'A field showing a month that opens a year and a 12-month grid, with optional limits and clearing.',
        parts: ['MonthPicker'],
        examples: ['Default', 'Range'],
    },
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
        slug: 'select',
        title: 'Select',
        description:
            'Pick one value from a short list, fully keyboard-driven. For long or searchable lists, use Dropdown.',
        parts: ['Select'],
        examples: ['Default', 'CustomOptions'],
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
        slug: 'slider',
        title: 'Slider',
        description: 'A native range input with a glowing thumb and any track you like.',
        parts: ['Slider'],
        examples: ['Default', 'Hue'],
    },
    {
        slug: 'spinner',
        title: 'Spinner',
        description: 'A small loading spinner in the current text colour, announced to screen readers when labelled.',
        parts: ['Spinner'],
        examples: ['Default', 'Loading'],
    },
    {
        slug: 'tab-bar',
        title: 'Tab Bar',
        description: 'Phone navigation fixed to the bottom of the screen. Works with any router.',
        parts: ['TabBar', 'TabBarItem'],
    },
    {
        slug: 'table',
        title: 'Table',
        description:
            'Composable tables: a glass panel that scrolls, sticky headers, first column and totals, sortable columns, and virtual rows for long lists.',
        parts: [
            'TableContainer',
            'Table',
            'TableHead',
            'TableCell',
            'TableFooter',
            'TableFooterCell',
            'TableSpacerRow',
        ],
        examples: ['Default', 'Sortable', 'Virtual'],
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
    {
        slug: 'theming',
        title: 'Theming & styling',
        description:
            'Your own colours from a few settings, readable in dark and light for any hue; and className overrides that always win.',
        folder: 'utils',
        parts: [],
        imports: ['applyTheme', 'applyPreset', 'customize', 'PRESETS', 'DEFAULT_THEME', 'themeVars', 'cx'],
        examples: ['ThemeEditor', 'Stylesheet', 'Overrides'],
    },
    {
        slug: 'tree',
        title: 'Tree Table',
        description:
            'Rows that open into child rows, animated, built from useTree and the Table parts. With virtual rows and editable cells, enough for a budget planner.',
        parts: ['TreeRow', 'TreeCell', 'TreeLabel', 'TreeToggle'],
        examples: ['Basic', 'Planner'],
    },
];

// Trailing slashes throughout: pages are built as <path>/index.html, which Cloudflare serves at
// <path>/ (and Storybook's relative asset paths need its slash too).
export const componentPath = (slug: string) => `/components/${slug}/`;

/** Every URL on the site. */
export const ROUTES = ['/', '/showcase/', ...COMPONENTS.map((c) => componentPath(c.slug))];
