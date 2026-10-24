import { cx } from '@zen/utils/cx';
import { useMergedRefs } from '@zen/utils/refs';
import { useHeightVar } from '@zen/utils/useHeightVar';
import { ComponentProps, useRef } from 'react';

/**
 * What's playing, along the bottom of the screen: a glass bar for the cover,
 * the title, the controls and a SeekBar, laid out as you like. It sits on a
 * TabBar beside it (in the same parent), and clears the home indicator where
 * there's none. Its height is kept in `--zen-player-bar-height` on that
 * parent, for the page to pad its end by. Name it with an aria-label ("Now playing"). Drive it with useMediaPlayer.
 */
export default function PlayerBar({ className, ref, ...rest }: PlayerBarProps) {
    const own = useRef<HTMLElement>(null);
    useHeightVar(own, '--zen-player-bar-height');
    return (
        <section
            ref={useMergedRefs(own, ref)}
            className={cx(
                'zen__player-bar glass glass-blur glow-edge fixed inset-x-0 bottom-[var(--zen-tab-bar-height,0px)] z-40 flex items-center gap-4 rounded-none border-x-0! border-b-0! px-4 pt-3',
                // On a TabBar, which clears the home indicator itself; else clear it here.
                'pb-[calc(0.75rem_+_max(0px,_env(safe-area-inset-bottom)_-_var(--zen-tab-bar-height,_0px)))]',
                className,
            )}
            {...rest}
        />
    );
}

export type PlayerBarProps = ComponentProps<'section'>;
