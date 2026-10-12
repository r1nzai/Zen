# Changelog

## 0.14.0

### Added to existing components

- **NumberField**: `onValueChange` gets a second argument saying how the number changed: `{ reason: 'step', delta }` for − +, ↑↓ and Page Up/Down, `'input'` for typing, `'limit'` for Home and End. `onValueCommit` fires once per finished change: each step, and what's typed on Enter or on leaving the field. So a step can be sent on as a step to whatever keeps the number (see Number Field → Steps).

## 0.13.0

Since 0.12.0. This release renames things. Every breaking change is listed first, with what to change.

### Breaking changes

#### Callbacks are named for what they change

| Before                                             | After                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onChange`                                         | `onValueChange` on Select, Segmented, RadioGroup, RadioCards, Calendar, DatePicker, DateRangePicker, MonthPicker, MoneyInput, ColorPicker, ColorPanel, IconPicker, RepeatPicker and SortableList (Combobox, Keypad, Slider, RangeSlider, TagInput and Tabs already used it) |
| `onChange(checked)` on Checkbox, Toggle            | `onCheckedChange(checked)`; `onChange` is the native event again                                                                                                                                                                                                            |
| Canvas `onChange` / `onChangeEnd` / `onSelect`     | `onItemsChange` / `onItemsChangeEnd` / `onSelectedChange`                                                                                                                                                                                                                   |
| CalendarHeatmap `onSelect`                         | `onSelectedChange`                                                                                                                                                                                                                                                          |
| DatePicker, DateRangePicker, MonthPicker `onClear` | `clearable`; clearing calls `onValueChange(null)`                                                                                                                                                                                                                           |

`value` is optional wherever it was required. Leave it out and pass `defaultValue` to let the control keep its own.

#### One tone scale: `default`, `positive`, `negative`

| Before                                                          | After                                      |
| --------------------------------------------------------------- | ------------------------------------------ |
| `destructive` (Button, Badge, ChartReference, TableSwipeAction) | `tone="negative"`                          |
| `danger` (Meter), `error` (Toast, FormMessage)                  | `negative`                                 |
| `success`                                                       | `positive`                                 |
| `info` (Toast, FormMessage), `primary` (Sparkline)              | `default`                                  |
| MenuItem, ConfirmDialog `destructive`                           | `tone="negative"`                          |
| Button `variant="destructive"`                                  | `tone="negative"` (on the default variant) |
| Button `variant="icon"`                                         | `variant="ghost"` with an icon size        |

#### Sizes

- Icon buttons line up with fields and buttons of the same size: `icon-sm` is 32px, `icon` is 40px (was 36), `icon-lg` is 44px. The old 24px `icon-sm` is now `icon-xs`.
- ThemeToggle is 40px.
- Input's `size` is `"sm" | "lg"` (Button's heights). It no longer passes through the native `size` attribute.

#### Right to left

- Table: `sticky="left"` is `sticky="start"`.
- TableContainer's `data-under-left` attribute is `data-under-start`.
- The `.zen__sticky-left` class is `.zen__sticky-start`.
- Spacing, corners and positions use logical sides, so a class you override may now be `ps-*`/`pe-*`/`start-*`/`end-*`/`text-start` rather than `pl-*`/`left-*`/`text-left`.

#### Forms

- MoneyInput with `name` submits the amount in minor units, from a hidden input (e.g. `123450` for $1,234.50). It used to submit the visible text.

#### Words

- `ICON_COLORS` entries no longer have English labels: `IconColor.label` is optional, and the names come from the messages.
- `ImageCropError` takes a `reason` code first, `new ImageCropError(reason, message)`, so you can show the error in your own words.
- `describeRepeat` takes the words as an optional last argument.

### New components

- **Accordion**: disclosures where one or several (`multiple`) open at a time, with ↑↓, Home and End between headings.
- **Separator**: across or upright, and `decorative` when it's only visual.
- **ToggleGroup**: buttons that stay pressed, one or several (`multiple`).
- **Toolbar**: one Tab stop, with arrow keys through its controls, a ToggleGroup's items included. Runs across or upright.
- **ButtonGroup**: buttons joined into one control, a split button's menu included.
- **HoverCard**: a glass preview of what a link points to, on hover or keyboard focus.
- **NumberField**: a number with − and + buttons and arrow keys (PageUp/PageDown for larger steps). Typed and shown in the locale's format, including percent.
- **TimeField**: hours, minutes and AM/PM as segments, in the locale's order and clock.
- **Carousel**: native scroll snapping, with glass previous/next buttons and dots in CarouselControls, and the arrow keys.
- **Resizable** (ResizablePanelGroup, ResizablePanel, ResizableHandle): drag a handle or use the arrow keys, within each panel's limits. Groups nest, and `onLayout` reports the sizes.
- **Menubar**: a row of menus with one Tab stop. ←→ move between them; with one open, ←→ open the next and hover switches.
- **NavigationMenu**: site navigation with panels of links that open on hover or click.
- **SortableTree**: drag-and-drop for groups and nested items. Drop into another group, into an open sub-item, or under another item; `accepts` says what goes where. Keyboard: ↑↓ through every allowed place, ←→ a level out or in, each step announced. Works on table rows (see Table → Reorder).
- **LocaleProvider**: the locale and every word Zen shows or announces. Pass a partial `messages` to translate or reword any of them (`ENGLISH` lists them all).

### Added to existing components

- **Menu**:
    - Submenus (MenuSub, MenuSubTrigger, MenuSubContent).
    - MenuCheckboxItem, and MenuRadioGroup with MenuRadioItem.
    - ↓ or ↑ on a MenuTrigger opens the menu at its first or last item.
- **SortableList**: `asChild` on the list and its items, to sort your own elements, such as a TableBody's rows.
- **Fields** (Input, InputGroup, MoneyInput, Select, Combobox, DatePicker, DateRangePicker, MonthPicker, ColorPicker): `size="sm" | "lg"`, at Button's heights.
- **Form submission and reset**: custom controls with a `name` are submitted with their form and reset with it. These are Combobox, the date and month pickers, MoneyInput, ColorPicker, TagInput, RepeatPicker, RangeSlider and IconPicker.
- **Props and refs**: `id`, `data-*`, `aria-*`, `style`, handlers and `ref` reach every component's element. Where a component keeps its own ref, yours is merged with it.
- **Exported props types**: every component's props type is exported (`ButtonProps`, `TabsProps`…).
- **Server components**: `'use client'` marks only modules that use React. Money, dates, `cx`, colours and the package entry can be called from server components.
- **Right to left**: layout, arrow keys, chevrons and slider fills follow `dir`. Calendar, CalendarHeatmap and Pagination use the locale's digits.
- **Focus**: every control uses the same keyboard focus ring (the `focus-ring` utility).

### Fixes

- Calendar marks today only once hydrated, so server and client render the same.
- Combobox's list is named after its field.
- Tabs without panels no longer point `aria-controls` at nothing.
- Closed popovers and dialogs stay hidden whatever `className` lays them out with.
- HoverCard and Tooltip are placed against their trigger in browsers without CSS anchor positioning.

### Tests

- Behaviour tests now run in Chromium, Firefox and WebKit, with new keyboard tests and accessibility checks of open popups in both themes. CI runs them.
