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
        slug: 'alert',
        title: 'Alert',
        description:
            'A notice, warning or failure beside what it is about: a tinted box, or a plain line in a form or card.',
        parts: ['Alert'],
        examples: ['Default', 'Plain'],
    },
    {
        slug: 'animated-number',
        title: 'Animated Number',
        description: 'Numbers and amounts that count smoothly to each new value.',
        parts: ['AnimatedNumber', 'AnimatedMoney'],
        examples: ['Default', 'Roll'],
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
        slug: 'breadcrumbs',
        title: 'Breadcrumbs',
        description: 'Where a page sits: its parents as links, then the page itself. Works with any router.',
        parts: ['Breadcrumbs', 'Breadcrumb'],
    },
    {
        slug: 'button',
        title: 'Button',
        description: 'Actions, from the one glowing primary action to quiet ghost buttons.',
        parts: ['Button'],
        examples: ['Variants', 'Sizes', 'Tones', 'Loading', 'AsLink'],
    },
    {
        slug: 'calendar-heatmap',
        title: 'Calendar Heatmap',
        description: 'A month of days shaded by their value, like spending per day.',
        parts: ['CalendarHeatmap'],
    },
    {
        slug: 'card',
        title: 'Card',
        description: 'Glass panels for grouping content, and stats for single figures.',
        parts: ['Card', 'CardHeader', 'CardTitle', 'CardDescription', 'Stat', 'StatRow'],
        examples: ['Goal', 'Stats', 'Morph'],
    },
    {
        slug: 'calendar',
        title: 'Calendar',
        description:
            'A month grid to pick a date or a range, fully keyboard-driven, with limits, blocked days and a year view to jump far.',
        parts: ['Calendar'],
        examples: ['Default', 'Range', 'Limits'],
    },
    {
        slug: 'chart',
        title: 'Chart',
        description:
            'Areas, lines and bars on one axis, a donut and an allocation bar: plain SVG that draws itself in, with a crosshair tooltip, keyboard reading, a legend and a table for screen readers.',
        parts: [
            'Chart',
            'ChartArea',
            'ChartLine',
            'ChartBar',
            'ChartReference',
            'ChartTooltipCard',
            'DonutChart',
            'AllocationBar',
        ],
        examples: ['Balance', 'Cashflow', 'Lines', 'Donut', 'Allocation'],
    },
    {
        slug: 'checkbox',
        title: 'Checkbox',
        description: 'A native checkbox whose tick draws itself in, with a label, a description and a mixed state.',
        parts: ['Checkbox'],
        examples: ['Default', 'SelectAll'],
    },
    {
        slug: 'chip',
        title: 'Chip',
        description: 'Small pressable buttons for quick picks beside a field, like common tenures.',
        parts: ['Chip'],
    },
    {
        slug: 'code-block',
        title: 'Code Block',
        description: 'Code with a copy button; bring your own highlighter for colours.',
        parts: ['CodeBlock'],
        examples: ['Highlighted', 'Plain', 'InCard'],
    },
    {
        slug: 'code-input',
        title: 'Code Input',
        description:
            'A one-time code, a box per character, that types, pastes and autofills from a text message like any field.',
        parts: ['CodeInput'],
    },
    {
        slug: 'collapse',
        title: 'Collapse',
        description: 'Shows as many items as fit on one line, and the rest behind "+N".',
        parts: ['Collapse'],
    },
    {
        slug: 'combobox',
        title: 'Combobox',
        description:
            'Search and pick one or several items of any shape, composed from parts: field, panel, search, a virtualized list, empty and create rows.',
        parts: [
            'Combobox',
            'ComboboxTrigger',
            'ComboboxSearch',
            'ComboboxList',
            'ComboboxItem',
            'ComboboxEmpty',
            'ComboboxCreate',
        ],
        examples: ['Accounts', 'Tags', 'ManyItems'],
    },
    {
        slug: 'command-palette',
        title: 'Command Palette',
        description:
            'Search everything and act on it from the keyboard: a field over a list that narrows as you type, opened with ⌘K.',
        parts: ['CommandPalette'],
        imports: ['CommandPalette', 'useCommandPaletteShortcut'],
    },
    {
        slug: 'date-picker',
        title: 'Date Picker',
        description:
            'A field that opens a calendar: one date, or a range previewed as you point. Dates are "YYYY-MM-DD" strings, so they never shift with time zones.',
        parts: ['DatePicker', 'DateRangePicker'],
        examples: ['Default', 'Range', 'Presets', 'InField'],
    },
    {
        slug: 'dialog',
        title: 'Dialog',
        description:
            'Modal dialogs on the native <dialog> element, sheets that slide in from an edge, and a confirmation for destructive actions.',
        parts: ['Dialog', 'DialogFooter', 'DialogClose', 'ConfirmDialog'],
        examples: ['Form', 'Sheets', 'Pickers', 'Confirm'],
    },
    {
        slug: 'disclosure',
        title: 'Disclosure',
        description: 'A button that shows and hides a section, like finished goals under a list.',
        parts: ['Disclosure', 'DisclosureTrigger', 'DisclosureContent'],
    },
    {
        slug: 'editable-cell',
        title: 'Editable Cell',
        description: 'A value edited in place: shows the value, swaps in any editor on click or Enter.',
        parts: ['EditableCell'],
    },
    {
        slug: 'empty-state',
        title: 'Empty State',
        description: "What a list or page shows when there's nothing in it yet, and the action that fills it.",
        parts: ['EmptyState'],
    },
    {
        slug: 'field',
        title: 'Field',
        description:
            'A label, hint and error wired to their control for screen readers, and messages for a whole form.',
        parts: ['Field', 'FormMessage'],
    },
    {
        slug: 'file-drop',
        title: 'File Drop',
        description: 'Somewhere to drop files, or click to choose them, that lights up as files are dragged over it.',
        parts: ['FileDrop'],
    },
    {
        slug: 'filter-bar',
        title: 'Filter Bar',
        description: 'The filters in effect, each removed with its \u00d7, and Clear all.',
        parts: ['FilterBar', 'FilterChip'],
    },
    {
        slug: 'header',
        title: 'Header',
        description: 'A sticky glass bar across the top of the page.',
        parts: ['Header'],
    },
    {
        slug: 'icon-picker',
        title: 'Icon Picker',
        description: 'An icon and a colour for something, like a spending category, from a grid in a popover.',
        parts: ['IconPicker'],
    },
    {
        slug: 'inset',
        title: 'Inset',
        description:
            'A faint box set into a card: a tile for one figure, or a bordered panel for a result, tinted for good or bad news.',
        parts: ['Inset'],
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
        slug: 'kbd',
        title: 'Kbd',
        description: 'Keys on the keyboard, for shortcuts in hints and tooltips.',
        parts: ['Kbd'],
    },
    {
        slug: 'keypad',
        title: 'Keypad',
        description: 'A number pad for typing an amount on a phone.',
        parts: ['Keypad'],
    },
    {
        slug: 'load-more',
        title: 'Load More',
        description:
            'The end of a long list that has more: loads the next page when it scrolls into view, or on a press.',
        parts: ['LoadMore'],
    },
    {
        slug: 'menu',
        title: 'Menu',
        description:
            'A button that opens a menu, or a context menu from a right-click or long press, with your own trigger, a header, icons, groups and destructive items.',
        parts: ['Menu', 'MenuTrigger', 'MenuContextTrigger', 'MenuContent', 'MenuItem', 'MenuSeparator', 'MenuHeader'],
        examples: ['Account', 'Actions', 'Context'],
    },
    {
        slug: 'meter',
        title: 'Meter',
        description: 'A measure against a limit, like spend against a budget: warm near it, red past it.',
        parts: ['Meter'],
        examples: ['Budget', 'Milestones'],
    },
    {
        slug: 'money-input',
        title: 'Money Input',
        description:
            'Amounts in any currency and locale, with shorthand like 1.5L or 10k and sums like 120+45.50, exact to the paisa, and typed in other currencies, converted at your rates. Built on Input Group.',
        parts: ['MoneyInput', 'MoneyCurrencyMenu', 'MoneyConversionHint'],
        examples: ['Default', 'Dollars', 'Convert', 'Compact'],
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
        slug: 'page-header',
        title: 'Page Header',
        description: 'Eyebrow, aurora title and lead paragraph for the top of a page.',
        parts: ['PageHeader'],
    },
    {
        slug: 'page-transition',
        title: 'Page Transition',
        description:
            'The old page fades out as the new one rises in, when your router changes page in a view transition.',
        parts: ['PageTransition'],
    },
    {
        slug: 'pagination',
        title: 'Pagination',
        description: 'The pages a long list is split into, as buttons or links for your router.',
        parts: ['Pagination'],
    },
    {
        slug: 'pills',
        title: 'Pills',
        description:
            'A glass track with a glowing pill that slides to the current page. In a nav, it is site navigation; works with any router.',
        parts: ['Pills', 'Pill', 'PillIndicator'],
        examples: ['Navigation'],
    },
    {
        slug: 'popover',
        title: 'Popover',
        description:
            'A glass panel that opens from a button, on the native Popover API: small forms, cards and settings. For hints use Tooltip; for actions, Menu.',
        parts: ['Popover', 'PopoverTrigger', 'PopoverContent', 'PopoverClose'],
        examples: ['ProfileCard', 'FeedbackForm', 'Settings', 'Controlled'],
    },
    {
        slug: 'progress-ring',
        title: 'Progress Ring',
        description: 'Circular progress with room for a label in the middle.',
        parts: ['ProgressRing'],
        examples: ['Default', 'Goal'],
    },
    {
        slug: 'radio-cards',
        title: 'Radio Cards',
        description: 'Choose one of a few cards that each show their option, like a colour palette.',
        parts: ['RadioCards', 'RadioCard'],
    },
    {
        slug: 'radio-group',
        title: 'Radio Group',
        description:
            'Choose one of a list, each option with a label and a description; native radios, so arrow keys work.',
        parts: ['RadioGroup', 'Radio'],
        examples: ['Default', 'Horizontal'],
    },
    {
        slug: 'range-slider',
        title: 'Range Slider',
        description: 'Two thumbs on one track, for a span like an amount from $50 to $500.',
        parts: ['RangeSlider'],
    },
    {
        slug: 'repeat-picker',
        title: 'Repeat Picker',
        description: 'How often something recurs, like a bill, said in words, with the next dates it falls on.',
        parts: ['RepeatPicker'],
    },
    {
        slug: 'segmented',
        title: 'Segmented',
        description: 'A pill row for a few mutually exclusive options.',
        parts: ['Segmented', 'SegmentedItem'],
        examples: ['Default', 'WithIcons'],
    },
    {
        slug: 'select',
        title: 'Select',
        description:
            'Pick one value from a short list, fully keyboard-driven. For long or searchable lists, use Combobox.',
        parts: ['Select', 'SelectItem', 'SelectGroup', 'SelectSeparator'],
        examples: ['Default', 'CustomOptions', 'Groups'],
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
        examples: ['LoadingCard', 'Reveal', 'WithSpinner'],
    },
    {
        slug: 'slider',
        title: 'Slider',
        description: 'A native range input with a glowing thumb and any track you like.',
        parts: ['Slider'],
        examples: ['Default', 'Hue'],
    },
    {
        slug: 'sortable',
        title: 'Sortable List',
        description: 'Put a list in order by dragging items by a grip, or with the keyboard, each step announced.',
        parts: ['SortableList', 'SortableItem', 'SortableHandle'],
    },
    {
        slug: 'sparkline',
        title: 'Sparkline',
        description: 'A small line of how a number has moved, with no axes, for beside a figure. It draws itself in.',
        parts: ['Sparkline'],
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
        slug: 'status-pill',
        title: 'Status Pill',
        description:
            'A small status that changes in place, such as Saving…, Saved or Not saved with a Retry, and fades back once the news is old.',
        parts: ['StatusPill', 'StatusPillAction'],
        examples: ['Save'],
    },
    {
        slug: 'stepper',
        title: 'Stepper',
        description: 'The steps of a flow and where you are in it; the line between them fills in as you go.',
        parts: ['Stepper', 'Step'],
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
            'TableSelectCell',
            'TableSelectHead',
            'SelectionBar',
            'TableSwipeRow',
            'TableSwipeAction',
        ],
        examples: ['Default', 'Sortable', 'Selectable', 'Swipe', 'Detail', 'Virtual'],
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
        description:
            'Switch between panels in place, with an underline or a glowing pill that slides to the active tab. To go to another page, use Pills.',
        parts: ['Tabs', 'TabList', 'Tab', 'TabPanel'],
        examples: ['Underline', 'Pills', 'Panels'],
    },
    {
        slug: 'tag-input',
        title: 'Tag Input',
        description:
            'A field of short values (tags, emails): Enter or a comma adds one, Backspace takes the last back.',
        parts: ['TagInput'],
    },
    { slug: 'textarea', title: 'Textarea', description: 'Multi-line text, styled like Input.', parts: ['TextArea'] },
    {
        slug: 'theme-toggle',
        title: 'Theme Toggle',
        description:
            'Switches between the dark and light themes, remembering the choice itself or leaving it to your app.',
        parts: ['ThemeToggle', 'ThemeScript'],
        examples: ['Default', 'YourState'],
    },
    {
        slug: 'timeline',
        title: 'Timeline',
        description: 'Events in order, each on a dot joined by a line: an activity feed or a history.',
        parts: ['Timeline', 'TimelineItem'],
    },
    {
        slug: 'toast',
        title: 'Toast',
        description:
            'Short messages that confirm an action or report a problem, with an optional action like Undo. They stack into a deck that fans out when pointed at, and swipe away.',
        parts: ['ToastProvider'],
    },
    { slug: 'toggle', title: 'Toggle', description: 'An on/off switch.', parts: ['Toggle'] },
    {
        slug: 'tooltip',
        title: 'Tooltip',
        description: 'A short glass hint on hover or keyboard focus, describing its trigger to screen readers.',
        parts: ['Tooltip', 'TooltipTrigger', 'TooltipContent'],
    },
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
    {
        slug: 'trend',
        title: 'Trend',
        description: 'A change, like +12% with an arrow, coloured by whether it is good news.',
        parts: ['Trend'],
    },
];

// Trailing slashes throughout: pages are built as <path>/index.html, which Cloudflare serves at
// <path>/ (and Storybook's relative asset paths need its slash too).
export const componentPath = (slug: string) => `/components/${slug}/`;

/** Every URL on the site. */
export const ROUTES = ['/', '/showcase/', ...COMPONENTS.map((c) => componentPath(c.slug))];
