/**
 * Every word Zen's components show or announce, in English. Give LocaleProvider
 * your own for any of them (a translation, or just different wording); the rest
 * stay English. Entries that take a value are functions.
 */
export const ENGLISH = {
    // Shared
    clear: 'Clear',
    cancel: 'Cancel',
    close: 'Close',
    dismiss: 'Dismiss',
    delete: 'Delete',
    remove: (item: string) => `Remove ${item}`,
    noResults: 'No results',
    search: 'Search…',
    expand: 'Expand',
    collapse: 'Collapse',
    minimum: 'Minimum',
    increase: 'Increase',
    hour: 'Hour',
    minute: 'Minute',
    dayPeriod: 'AM/PM',
    decrease: 'Decrease',
    maximum: 'Maximum',

    // Select, Combobox, CommandPalette
    selectPlaceholder: 'Select…',
    searchOptions: 'Search options',
    add: (text: string) => `Add ${text}`,
    commands: 'Commands',

    // Calendar, DatePicker, MonthPicker
    pickDate: 'Pick a date',
    pickDates: 'Pick dates',
    chooseDate: 'Choose date',
    chooseDates: 'Choose dates',
    presets: 'Presets',
    pickMonth: 'Pick a month',
    chooseMonth: 'Choose month',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    previousYear: 'Previous year',
    nextYear: 'Next year',
    chooseMonthAndYear: (month: string) => `${month}, choose month and year`,
    backToDays: (year: number) => `${year}, back to days`,

    // ColorPicker
    chooseColour: 'Choose colour',
    saturationBrightness: 'Saturation and brightness',
    saturationBrightnessValue: (saturation: number, brightness: number) =>
        `Saturation ${saturation}%, brightness ${brightness}%`,
    hue: 'Hue',
    hueValue: (degrees: number) => `Hue ${degrees} degrees`,
    opacity: 'Opacity',
    opacityValue: (percent: number) => `Opacity ${percent}%`,
    hex: 'Hex',
    swatches: 'Swatches',

    // IconPicker
    colour: 'Colour',
    icon: 'Icon',
    none: 'none',
    colourNames: {
        blue: 'Blue',
        orange: 'Orange',
        teal: 'Teal',
        amber: 'Amber',
        pink: 'Pink',
        green: 'Green',
        violet: 'Violet',
        red: 'Red',
    },

    // MoneyInput
    currency: 'Currency',
    yourCurrency: 'Your currency',
    changeCurrency: (currency: string) => `Currency: ${currency}. Change to enter another currency`,
    enterAmount: 'Enter an amount.',
    notAnAmount: (example: string, short: string) => `Not an amount. Try ${example} or ${short}.`,
    noNegative: "Amount can't be negative.",
    rateFailed: "Couldn't get today's exchange rate.",
    rateLoading: "Still getting today's rate…",
    otherCurrencies: 'Enter in another currency, converted at today’s rate',
    gettingRate: 'Getting today’s rate…',
    ratesUnavailable: (home: string) => `Couldn’t get exchange rates. Enter the amount in ${home}.`,
    convertedFrom: (amount: string, rate: string) => `Converted from ${amount} at ${rate}`,
    rateOf: (currency: string, amount: string) => `1 ${currency} = ${amount}`,

    // RepeatPicker and describeRepeat
    repeats: 'Repeats',
    every: 'Every',
    howMany: 'How many',
    unit: 'Unit',
    on: 'On',
    day: (n: number) => `Day ${n}`,
    lastDay: 'Last day',
    next: 'Next:',
    repeatUnit: (unit: 'day' | 'week' | 'month' | 'year', count: number) => (count === 1 ? unit : `${unit}s`),
    repeatEvery: (every: number, unit: string) => (every === 1 ? `Every ${unit}` : `Every ${every} ${unit}`),
    repeatOn: (rule: string, when: string) => `${rule} on ${when}`,
    repeatDay: (n: number) => `day ${n}`,
    repeatLastDay: 'the last day',

    // Sortable
    reorder: (item: string) => `Reorder ${item}`,
    pickedUp: (item: string, place: string) =>
        `${item} picked up, ${place}. Arrow keys move it, Space drops it, Escape puts it back.`,
    dropped: (item: string, place: string) => `${item} dropped, ${place}.`,
    movedTo: (item: string, place: string) => `${item}, ${place}.`,
    putBack: (item: string, place?: string) => (place ? `${item} put back, ${place}.` : `${item} put back.`),
    place: (position: number, count: number) => `${position} of ${count}`,

    // Canvas
    resized: (item: string, width: number, height: number) => `${item} resized to ${width} by ${height}.`,
    moved: (item: string, x: number, y: number) => `${item} moved to ${x}, ${y}.`,
    selected: (count: number) => `${count} ${count === 1 ? 'item' : 'items'} selected.`,
    canvasHelp:
        'Arrow keys move the selection, Shift with them by 10. Alt with the arrow keys resizes. Escape deselects.',

    // Table
    nothingHere: 'Nothing here yet.',
    selectAll: 'Select all',
    selectedCount: (count: number) => `${count} selected`,
    clearSelection: 'Clear selection',
    selection: 'Selection',

    // Chart, Sparkline
    legend: 'Legend',
    readChart: (label: string) => `${label}: use the arrow keys to read values`,
    fromTo: (first: string, last: string) => `From ${first} to ${last}`,

    // Others
    activeFilters: 'Active filters',
    clearAll: 'Clear all',
    removeFilter: 'Remove filter',
    skipToContent: 'Skip to content',
    keypad: 'Keypad',
    loadMore: 'Load more',
    loadingMore: 'Loading more…',
    progress: 'Progress',
    onThisPage: 'On this page',
    switchToDark: 'Switch to dark theme',
    switchToLight: 'Switch to light theme',
    copy: 'Copy',
    copied: 'Copied',
    showMore: (what: string) => `Show ${what}`,
    pages: 'Pages',
    page: (n: number) => `Page ${n}`,
    previousPage: 'Previous page',
    nextPage: 'Next page',
    breadcrumb: 'Breadcrumb',
    notifications: 'Notifications (F8)',
};

export type Messages = typeof ENGLISH;
