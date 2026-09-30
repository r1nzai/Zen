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

The look is set in [Inter](https://rsms.me/inter/); load it however you like.

## Usage

```tsx
import { Backdrop, Button, Card } from '@rinzai/zen';

export default function App() {
    return (
        <>
            <Backdrop />
            <Card title="Budget">
                <Button>Save changes</Button>
            </Card>
        </>
    );
}
```

## What's inside

- **Surfaces:** Card, Inset, Alert, Stat, Dialog (and sheets from an edge), ConfirmDialog, Popover, Tooltip, Toast (a stacked deck), Disclosure, Backdrop (aurora, contours or dots, and a pointer light)
- **Inputs:** Button, Input, TextArea, InputGroup, MoneyInput (with currency conversion), Select, Combobox, Calendar, DatePicker, DateRangePicker, MonthPicker, Checkbox, RadioGroup, RadioCards, Segmented, Slider, Toggle, Chip, Field
- **Data:** Chart (areas, lines, bars) and DonutChart in plain SVG, composable Table with sticky edges and sorting, tree rows, editable cells, virtual rows, Meter, ProgressRing, AnimatedNumber, Badge, StatusPill (a live save status), Skeleton, Spinner
- **Navigation:** Header, Pills, Tabs, TabBar, SideNav, TableOfContents, Menu
- **Icons:** [Heroicons](https://heroicons.com) (24px outline; Ellipsis and the status icons are from their 16px set), generated from the `heroicons` package by `scripts/icons.mjs`, in the current text colour: Plus, CalendarIcon, TableIcon, ChartBarIcon, ListBullet, Squares, Flag, Bars, Sun, Moon, Lock, Logout, Settings, Search, XMark, Ellipsis, arrows, chevrons, and the status icons (Check, AlertTriangle, InfoCircle)
- **Theming:** dark and light, OKLCH tokens, and a theme generator (presets or any hue) that keeps contrast readable
- **Hooks and utilities:** `themeWave` (the theme spreads from the switch like a drop falling into water: ripples, glints and a rainbow edge, drawn on the GPU; `prepareThemeWave` readies it when the pointer reaches your own switch), `useAnchoredPopup`, `useVirtualList`, `useTree`, `useSort`, money, currency, month and date helpers, `cx` (Tailwind-aware class merging), `cva`

Every component takes `className`, and a class you pass always overrides the component's default.

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
