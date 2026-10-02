import { cx } from './cx';

/** Shared field look: faint glass, a hairline in the glow colour (white would grey it out) lit by the pointer, violet glow on focus. */
export const FIELD =
    'glow-border h-10 rounded-lg border [--glow-border-color:oklch(var(--glow)/0.22)] bg-tint/[0.035] px-3 text-sm text-foreground ' +
    'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-[border-color,background-color,box-shadow,--glow-border-color] duration-200 ' +
    'placeholder:text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))] hover:[--glow-border-color:oklch(var(--glow)/0.4)] ' +
    'focus-visible:border-glow/60 focus-visible:[--glow-border-color:transparent] focus-visible:bg-tint/[0.05] focus-visible:shadow-glow-focus focus-visible:outline-hidden ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Placeholder text in a trigger that shows one (Select, MonthPicker, DatePicker…). Fields use the same
 * colours through placeholder: in FIELD. --zen-placeholder dims it on dark glass, so a placeholder can't
 * pass for a value there (about 4.9:1 against 16.6:1); light mode already separates them.
 */
export const PLACEHOLDER = 'text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))]';

/** A picker's previous/next arrows (Calendar, MonthPicker). */
export const PICKER_NAV =
    'text-muted-foreground cursor-pointer hover:bg-tint/[0.07] hover:text-foreground focus-visible:ring-ring/50 grid size-8 place-items-center rounded-md outline-hidden transition-colors focus-visible:ring-2';

/** A month in a picker's month grid (Calendar, MonthPicker); add PICKER_MONTH_ON for the chosen one. */
export const PICKER_MONTH =
    'cursor-pointer rounded-lg py-2 text-sm outline-hidden transition-colors disabled:cursor-not-allowed disabled:opacity-35 focus-visible:ring-ring/50 focus-visible:ring-2 hover:bg-tint/[0.07]';
export const PICKER_MONTH_ON = 'bg-primary text-primary-foreground hover:bg-primary';

/** Glow a trigger carries while its popup is open. */
export const TRIGGER_OPEN = 'border-glow/60 [--glow-border-color:transparent] shadow-glow-focus';

/** Trigger for popup fields (dropdown): a field that glows while open. */
export const TRIGGER = cx(FIELD, 'inline-flex cursor-pointer items-center justify-between gap-2 whitespace-nowrap');

/** Popup panel (popover, dropdown list): glass with a soft glow. */
export const POPUP =
    'glass glass-blur rounded-xl text-foreground shadow-[var(--popup-shadow),0_0_40px_-20px_oklch(var(--glow)/calc(0.5*var(--glow-k)))] outline-hidden';

/** Pills (and TabList variant="pills"): a glass track… */
export const PILL_TRACK =
    'glow-edge relative flex w-fit items-center gap-1 rounded-full border border-tint/5 bg-tint/[0.03] p-1';

/** …a glowing pill that slides to the active item (its look is repeated in theme.css, for before it's measured)… */
export const PILL_INDICATOR =
    'absolute top-1 bottom-1 left-0 rounded-full bg-primary/15 shadow-[inset_0_0_0_1px_oklch(var(--glow)/0.35),0_0_24px_-4px_oklch(var(--glow)/calc(0.6*var(--glow-k)))] transition-[translate,width] duration-500 ease-out-soft';

/** …and items that sit above it, lit when current (a link) or selected (a tab). Only their text colour
 * transitions: the pill they wear before the indicator is measured (theme.css) must go at once. */
export const PILL =
    'relative z-10 cursor-pointer disabled:cursor-not-allowed rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap outline-hidden transition-[color] duration-300 select-none focus-visible:ring-2 focus-visible:ring-ring/40 ' +
    'text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-selected:text-foreground';

/**
 * For a wrapper whose child input takes focus (InputGroup): FIELD, lit by
 * focus-within. Written out in full rather than derived from FIELD, because
 * Tailwind only generates classes that appear literally in the source.
 */
export const FIELD_WITHIN =
    'glow-border flex w-full items-center gap-1.5 h-10 rounded-lg border [--glow-border-color:oklch(var(--glow)/0.22)] bg-tint/[0.035] px-3 text-sm text-foreground ' +
    'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-[border-color,background-color,box-shadow,--glow-border-color] duration-200 ' +
    'placeholder:text-[color:oklch(var(--muted-foreground)/var(--zen-placeholder))] hover:[--glow-border-color:oklch(var(--glow)/0.4)] ' +
    'focus-within:border-glow/60 focus-within:[--glow-border-color:transparent] focus-within:bg-tint/[0.05] focus-within:shadow-glow-focus focus-within:outline-hidden ' +
    'disabled:cursor-not-allowed disabled:opacity-50';
