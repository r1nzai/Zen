# Zen

[![npm](https://img.shields.io/npm/v/@rinzai/zen)](https://www.npmjs.com/package/@rinzai/zen)

![Zen: React components in dark glass](https://zen.rinzai.dev/og.png)

React components in dark glass: translucent surfaces, hairline borders that catch a pointer light, and one accent colour carrying the UI. Built on native platform features (`<dialog>`, the Popover API, CSS anchor positioning, radio inputs) with **no runtime dependencies**.

**[Documentation](https://zen.rinzai.dev)** · **[Showcase app](https://zen.rinzai.dev/showcase/)** · **[Storybook](https://zen.rinzai.dev/storybook/)**

## Installation

```sh
pnpm add @rinzai/zen
```

React 19 is the only peer dependency.

**Using Tailwind CSS v4?** Add Zen's theme after Tailwind in your stylesheet. Your one Tailwind build then generates everything Zen's components use:

```css
@import 'tailwindcss';
@import '@rinzai/zen/tailwind.css';
```

**Not using Tailwind?** Import the complete stylesheet once, near the root of your app. It includes the default theme:

```js
import '@rinzai/zen/css';
```

Zen never styles your own elements. For its page setup (the background showing through), heading scale, inline code and quiet scrollbars, also add the optional base:

```css
@import '@rinzai/zen/base.css';
```

The look is set in [Geist](https://vercel.com/font); load it however you like.

## Usage

```tsx
import { Backdrop, Button, Card, CardHeader, CardTitle } from '@rinzai/zen';

export default function App() {
    return (
        <>
            <Backdrop />
            <Card>
                <CardHeader>
                    <CardTitle>Budget</CardTitle>
                </CardHeader>
                <Button>Save changes</Button>
            </Card>
        </>
    );
}
```

## What's inside

- **Surfaces:** Card, Inset, Alert, Stat, Dialog (and sheets from an edge), ConfirmDialog, Popover, Tooltip, HoverCard, Toast (a stacked deck), Disclosure, Accordion, Separator, Resizable panels, Carousel, Backdrop (aurora, contours or dots, and a pointer light)
- **Inputs:** Button, ButtonGroup, Toggle, ToggleGroup, Toolbar, Input, TextArea, InputGroup, NumberField, TimeField, MoneyInput (with currency conversion), Select, Combobox, Calendar, DatePicker, DateRangePicker, MonthPicker, ColorPicker, Checkbox, RadioGroup, RadioCards, Segmented, Slider, Chip, Field
- **Data:** Chart (areas, lines, bars) and DonutChart in plain SVG, composable Table with sticky edges, sorting and rows reordered by drag and drop, tree rows, editable cells, virtual rows, SortableList and SortableTree, Meter, ProgressRing, AnimatedNumber, Badge, StatusPill (a live save status), Skeleton, Spinner, Canvas (items placed freely, with snapping)
- **Navigation:** Header, NavigationMenu, Pills, Tabs, TabBar, SideNav, TableOfContents, Menu (with submenus, checkbox and radio items, and context menus), Menubar
- **Theming:** dark and light, OKLCH tokens, and a theme generator (presets or any hue) that keeps contrast readable
- **Languages:** LocaleProvider for the locale and every word, and right-to-left layout
- **Hooks and utilities:** `themeWave` (the theme spreads from the switch like a drop falling into water: ripples, glints and a rainbow edge, drawn on the GPU; `prepareThemeWave` readies it when the pointer reaches your own switch), `useAnchoredPopup`, `useVirtualList`, `useTree`, `useSort`, `useCopyToClipboard`, money, currency, month and date helpers, `hexToOklch` and `oklchToHex`, `cx` (Tailwind-aware class merging), `cva`

Every component takes `className`, and a class you pass always overrides the component's default. Other props (`id`, `aria-*`, `data-*`, handlers) and `ref` reach its element, and parts that render a link or button take `asChild` to use your own (a router's Link, say).

## Values and forms

Controls report changes with `onValueChange` (`onCheckedChange` for Checkbox and Toggle). Pass `value` to control one, or `defaultValue` to let it keep its own. Give a control a `name` and it's submitted with its form, the custom ones (Combobox, the date pickers, MoneyInput, ColorPicker, TagInput…) included, and goes back to its first value when the form is reset.

## Languages and right to left

```tsx
import { LocaleProvider } from '@rinzai/zen';

<LocaleProvider locale="fr-FR" messages={{ clear: 'Effacer', noResults: 'Aucun résultat' }}>
    <App />
</LocaleProvider>;
```

The locale formats dates, numbers and money, and sets the week's first day. `messages` replaces any of the words Zen shows or announces (`ENGLISH` lists them all); the rest stay English. With `dir="rtl"` on the page or any element above, layout, arrow keys and chevrons mirror.

## Theming

Dark is the default. Add the `light` class (or `data-theme="light"`) for the light palette. Colours are OKLCH `L C H` triplets; override any token in your own CSS:

```css
:root {
    --primary: 0.72 0.13 200; /* teal instead of violet */
    --glow: 0.7 0.13 200;
}
```

Or generate a whole theme at runtime:

```ts
import { applyPreset, applyTheme, DEFAULT_THEME } from '@rinzai/zen';

applyTheme(applyPreset(DEFAULT_THEME, 'ocean'));
```

## Overlays

For a page composited over something else, such as an OBS browser source, which never gets a pointer:

```html
<html data-zen-glow="ambient" data-zen-page="transparent"></html>
```

`data-zen-glow="ambient"` sends the edge light round each glowing border by itself (on any element, it does so for what's inside). `data-zen-page="transparent"` paints nothing behind the content; it needs the base stylesheet.

## Browser support

Chrome and Edge 114+, Safari 17+ and Firefox 128+: the versions with the native Popover API that popups, menus and toasts are built on, and with what Tailwind v4 needs.

- **Popups** are placed with CSS anchor positioning where the browser has it (Chrome 129+, Safari 26+, recent Firefox). Elsewhere Zen places them itself, the same way.
- **Glass** is blurred live where there's a GPU and a mouse. On touch screens, without hardware acceleration, and with the OS's "reduce transparency", surfaces are solid instead.
- **Motion** such as entry animations is left out where a browser lacks it, and for anyone who prefers reduced motion.

## Development

```sh
pnpm install
pnpm dev          # Storybook
pnpm docs:dev     # docs site
pnpm test
pnpm build
```

## License

[MIT](LICENSE)
