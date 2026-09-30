import { cx } from './cx';

/** Shared field look: faint glass, hairline border lit by the pointer, violet glow on focus. */
export const FIELD =
    'glow-border h-10 rounded-lg border [--glow-border-color:oklch(var(--tint)/0.1)] bg-tint/[0.035] px-3 text-sm text-foreground ' +
    'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-[border-color,background-color,box-shadow,--glow-border-color] duration-200 ' +
    'placeholder:text-muted-foreground hover:[--glow-border-color:oklch(var(--tint)/0.2)] ' +
    'focus-visible:border-glow/60 focus-visible:[--glow-border-color:transparent] focus-visible:bg-tint/[0.05] focus-visible:shadow-[0_0_0_3px_oklch(var(--glow)/0.16),0_0_24px_-6px_oklch(var(--glow)/0.6)] focus-visible:outline-hidden ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

/** Glow a trigger carries while its popup is open. */
export const TRIGGER_OPEN =
    'border-glow/60 [--glow-border-color:transparent] shadow-[0_0_0_3px_oklch(var(--glow)/0.16),0_0_24px_-6px_oklch(var(--glow)/0.6)]';

/** Trigger for popup fields (dropdown): a field that glows while open. */
export const TRIGGER = cx(FIELD, 'inline-flex items-center justify-between gap-2 whitespace-nowrap');

/** Popup panel (popover, dropdown list): glass with a soft glow. */
export const POPUP =
    'glass glass-blur rounded-xl text-foreground shadow-[var(--popup-shadow),0_0_40px_-20px_oklch(var(--glow)/0.5)] outline-hidden';

/** Pills (and TabList variant="pills"): a glass track… */
export const PILL_TRACK =
    'glow-edge relative flex w-fit items-center gap-1 rounded-full border border-tint/5 bg-tint/[0.03] p-1';

/** …a glowing pill that slides to the active item… */
export const PILL_INDICATOR =
    'absolute top-1 bottom-1 left-0 rounded-full bg-primary/15 shadow-[inset_0_0_0_1px_oklch(var(--glow)/0.35),0_0_24px_-4px_oklch(var(--glow)/0.6)] transition-[translate,width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]';

/** …and items that sit above it, lit when current (a link) or selected (a tab). */
export const PILL =
    'relative z-10 rounded-full px-3.5 py-1.5 text-sm whitespace-nowrap outline-hidden transition-colors duration-300 select-none focus-visible:ring-2 focus-visible:ring-ring/40 ' +
    'text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground aria-selected:text-foreground';

/**
 * For a wrapper whose child input takes focus (InputGroup): FIELD, lit by
 * focus-within. Written out in full rather than derived from FIELD, because
 * Tailwind only generates classes that appear literally in the source.
 */
export const FIELD_WITHIN =
    'glow-border flex w-full items-center gap-1.5 h-10 rounded-lg border [--glow-border-color:oklch(var(--tint)/0.1)] bg-tint/[0.035] px-3 text-sm text-foreground ' +
    'shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] transition-[border-color,background-color,box-shadow,--glow-border-color] duration-200 ' +
    'placeholder:text-muted-foreground hover:[--glow-border-color:oklch(var(--tint)/0.2)] ' +
    'focus-within:border-glow/60 focus-within:[--glow-border-color:transparent] focus-within:bg-tint/[0.05] focus-within:shadow-[0_0_0_3px_oklch(var(--glow)/0.16),0_0_24px_-6px_oklch(var(--glow)/0.6)] focus-within:outline-hidden ' +
    'disabled:cursor-not-allowed disabled:opacity-50';
