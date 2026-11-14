# Changelog

## 0.17.0

### Added to existing components

- **Slider**, **RangeSlider**: `size="sm"`, a thin track and a small thumb for a compact control such as a player's volume. Same colours, glow and focus ring; the slider stays 20px tall, so it's as easy to grab.

## 0.16.0

### Added to existing components

- **MenuContent**: `sheet` makes the menu a bottom sheet on phones (below `md`), as music apps show a song's menu: across the bottom of the screen over a scrim, with a grip, swiped down or tapped outside to close. Its submenus slide in over it, with a row at the top that goes back (the arrow back and Escape still do), and open only when chosen, not on hover. Wider screens keep the popover.
- **SortableList**: works with a virtualized list. Give it `itemHeight` and render only the rows in view (from `useVirtualList`), each at its place in `value`; a drag works from `value`, not the rows on screen, and rows that come into view as it scrolls the list take their places. `onLiftedChange` says which item is picked up (by its handle or from the keyboard), to keep its row rendered. An item moved with the keyboard is scrolled into view.
- **useVirtualList**: `keep` renders a row even when it's out of view, such as the one being dragged, with the rows between.
- **SeekBar**: `times="below"` puts the time played and the length under the ends of the bar, as on a phone's Now Playing screen.
- **TooltipContent**: `side="beside"` puts the tooltip after its trigger (before it if there's no room) instead of below, centred on it, as for the icons of a collapsed sidebar, where a tooltip below would cover the next icon. `align` lines up its top or bottom with the trigger's instead.
- **Anchored popups** (`anchoredStyle`): beside the trigger, `align` now chooses top (start, as before), middle (center) or bottom (end).

### Fixes

- **ToastProvider**: once its toasts were gone, the empty toast area kept its last height (the height it was given went negative, which browsers ignore) and caught clicks meant for what was under it, such as a player bar's controls. It now shrinks to nothing.

## 0.15.0

### New components

- **PlayerBar**: what's playing, in a glass bar along the bottom of the screen, laid out as you like. On phones it sits on the TabBar beside it.
- **SeekBar**: where playback is, filled to the time played and shaded on to what's loaded, between the time played and the length. Pass `playing` and it glides between the player's time updates, moved by the browser's compositor rather than per-frame renders. Dragging doesn't interrupt playback; letting go seeks; the arrow keys seek 5 seconds.
- **Marquee**: one line of text cut off with an ellipsis that scrolls to show the rest: on hover or keyboard focus of itself or of its `data-zen-marquee-host` (a row, a tile), or always (`trigger="always"`, for what's playing). Only text that doesn't fit moves, at the same speed whatever its length, with fades at the edges. Stays an ellipsis for reduced motion; the accessible name is the text.
- **useMediaPlayer**: drives your own `<audio>` or `<video>` (`const [ref, player] = useMediaPlayer()`, then `<audio ref={ref} />`) and keeps its state: playing, waiting, time, duration, buffered, volume. With `play`, `pause`, `toggle`, `seek`, `setVolume` and `setMuted`.
- **useMediaSession**: puts what's playing on the lock screen and the OS media controls (title, artist, cover, position), and lets play, pause, seek, previous, next and the media keys control your player.
- **formatDuration**: seconds as a clock reads them (3:07, 1:02:07).

### Renamed

- **TextArea** is now **Textarea** (and `TextAreaProps` is `TextareaProps`), like the element. The old names still work, marked deprecated, until the next breaking release.

### Added to existing components

- **TabBar**: its height is kept in `--zen-tab-bar-height` on its parent (0px while hidden), for a PlayerBar to sit on and the page to pad its end by. PlayerBar keeps `--zen-player-bar-height` the same way.
- **Segmented**, **RadioCards**: `label` is optional. Without it, name the group with `aria-label` or `aria-labelledby`, as on RadioGroup.
- **Slider**: `step="any"` for no snapping.

### Fixes

- **SegmentedItem**: an icon and its text sit side by side; they stacked.
- **Popover, Menu, Select and every anchored popup**: with no room below the trigger, a centred popup wider than its trigger stayed below it, off screen (Chrome) or over the trigger (Firefox), instead of flipping above. It flips now, and a popup lined up with an edge also switches edges when there's no room beside it.
- **Carousel**: where the slides don't fill the view evenly, Next stopped short of the end, the last slide cut off. The end is now the last stop, with its own dot.
- **TabBarItem**, **MenuItem**: with `asChild`, `icon` was dropped; it now goes ahead of your link's content, also when that content is a render function (a NavLink's).

### Docs

- The docs ship in the package as markdown, for AI agents: `node_modules/@rinzai/zen/dist/docs` has a page per component with every example's source, and the CHANGELOG is included. The site serves the same pages at `/docs/<component>.md`, with `/llms.txt` and `/llms-full.txt`.
- Props tables cover parts kept outside a package's `index.tsx`, such as SortableTree, SortableItem, DonutChart and the table's selection and swipe parts.
- The package's markdown pages have the props tables too, the same as the site's. Their README and `llms.txt` carry the README's guide: setup, the props every component takes, values and forms, languages, theming, overlays and browser support. The README now says Zen exports no icons.

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
