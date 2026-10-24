import { useMessages } from '@zen/locale-provider';
import Slider, { SliderProps } from '@zen/slider';
import { cx } from '@zen/utils/cx';
import { formatDuration } from '@zen/utils/duration';
import { KeyboardEvent, useLayoutEffect, useRef, useState } from 'react';

// Seconds an arrow key moves, as video players do.
const KEY_STEP = 5;

/**
 * Where playback is in a track, and the way to move it: filled up to the
 * current time, shaded on to what's loaded, between the time played and the
 * length. While playing it glides, run by the browser's compositor between
 * the player's time updates. While dragging, the time follows the thumb and
 * the track keeps playing; letting go seeks. The arrow keys seek 5 seconds.
 */
export default function SeekBar({
    currentTime,
    duration,
    buffered = 0,
    playing = false,
    playbackRate = 1,
    onSeek,
    onKeyDown,
    disabled,
    className,
    ...rest
}: SeekBarProps) {
    const m = useMessages();
    const [dragging, setDragging] = useState<number | null>(null);
    // Once let go, the thumb stays where it was dropped until the player reports the seek.
    const [dropped, setDropped] = useState<{ at: number; from: number } | null>(null);
    const settling = dropped && dropped.from === currentTime ? dropped.at : null;
    const time = Math.max(0, Math.min(dragging ?? settling ?? currentTime, duration));
    const fill = useRef<HTMLDivElement>(null);
    const thumb = useRef<HTMLDivElement>(null);

    // The fill and thumb are placed at the time, then (while playing) slide on
    // to the end at the track's speed: a linear animation run by the browser,
    // so nothing happens per frame. A time update that agrees with the slide
    // leaves it be; one that doesn't (a seek, a stall) starts it again from there.
    const gliding = playing && dragging === null && settling === null && duration > 0 && time < duration;
    const glide = useRef<{ animations: Animation[]; from: number; rate: number; duration: number } | null>(null);
    useLayoutEffect(() => {
        const parts = [fill.current, thumb.current].filter((el) => el !== null);
        if (!parts.length) return;
        const running = glide.current;
        if (gliding && running && running.rate === playbackRate && running.duration === duration) {
            const elapsed = Number(running.animations[0].currentTime ?? 0) / 1000;
            if (Math.abs(running.from + elapsed * playbackRate - time) < 0.15) return;
        }
        running?.animations.forEach((animation) => animation.cancel());
        glide.current = null;
        const sign = getComputedStyle(parts[0]).direction === 'rtl' ? -1 : 1;
        const at = (t: number) => `${duration > 0 ? (sign * t * 100) / duration : 0}cqw`;
        for (const el of parts) el.style.translate = at(time);
        if (!gliding) return;
        const animations = parts.map((el) =>
            el.animate([{ translate: at(time) }, { translate: at(duration) }], {
                duration: ((duration - time) / playbackRate) * 1000,
                easing: 'linear',
                fill: 'forwards',
            }),
        );
        glide.current = { animations, from: time, rate: playbackRate, duration };
    }, [time, duration, gliding, playbackRate]);
    useLayoutEffect(() => () => glide.current?.animations.forEach((animation) => animation.cancel()), []);

    const keys = (e: KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
        const by = { ArrowUp: 1, ArrowDown: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[e.key];
        if (!by) return;
        e.preventDefault();
        const to = Math.max(0, Math.min(time + by * KEY_STEP, duration));
        setDropped({ at: to, from: currentTime });
        onSeek(to);
    };
    const off = disabled || duration <= 0;
    const loaded = duration > 0 ? (Math.min(buffered, duration) / duration) * 100 : 0;
    // Both times as wide as the length, so the track doesn't shift as they count.
    const width = { width: `${formatDuration(duration).length}ch` };
    return (
        <div className={cx('zen__seek-bar flex items-center gap-3', className)}>
            <span className="text-muted-foreground shrink-0 text-end text-xs tabular-nums" style={width}>
                {formatDuration(time)}
            </span>
            <div className={cx('group relative h-5 min-w-0 flex-1', off && 'opacity-50')}>
                {/* The native slider, unseen, takes the pointer, the keys and assistive tech; its thumb is the size of the one drawn, so they line up. */}
                <Slider
                    aria-label={m.seek}
                    min={0}
                    max={duration || 1}
                    step="any"
                    value={time}
                    disabled={off}
                    valueText={() => m.timeOf(formatDuration(time), formatDuration(duration))}
                    className="absolute inset-0 z-10 h-full opacity-0"
                    onKeyDown={keys}
                    onValueChange={setDragging}
                    onValueCommit={(value) => {
                        setDragging(null);
                        setDropped({ at: value, from: currentTime });
                        onSeek(value);
                    }}
                    {...rest}
                />
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 overflow-hidden rounded-full bg-[oklch(var(--muted))]"
                >
                    <div
                        className="absolute inset-y-0 start-0 bg-[oklch(var(--tint)/0.22)] transition-[width] duration-300"
                        style={{ width: `${loaded}%` }}
                    />
                    {/* Thumb's centre to thumb's centre, as the slider runs: the cqw units are this box's width. */}
                    <div className="[container-type:inline-size] absolute inset-x-2.5 inset-y-0">
                        <div ref={fill} className="bg-primary absolute inset-y-0 end-full w-[calc(100%+0.625rem)]" />
                    </div>
                </div>
                <div
                    aria-hidden
                    className="[container-type:inline-size] pointer-events-none absolute inset-x-2.5 inset-y-0"
                >
                    <div
                        ref={thumb}
                        className="bg-primary group-has-[input:focus-visible]:ring-ring/40 absolute start-0 top-1/2 -ms-2.5 -mt-2.5 size-5 rounded-full border-2 border-white shadow-[0_0_0_1px_oklch(0_0_0/0.3),0_0_16px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] group-has-[input:focus-visible]:ring-4"
                    />
                </div>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums" style={width}>
                {formatDuration(duration)}
            </span>
        </div>
    );
}

export interface SeekBarProps extends Omit<
    SliderProps,
    'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'onValueChange' | 'onValueCommit' | 'trackBackground'
> {
    /** Seconds played. */
    currentTime: number;
    /** Seconds long; 0 while unknown (the bar is disabled). */
    duration: number;
    /** Seconds loaded, shaded on the track past the time played. */
    buffered?: number;
    /** While the time is running (playing, not waiting for data): the bar glides on between time updates. */
    playing?: boolean;
    /** How fast it moves on while playing (default 1). */
    playbackRate?: number;
    /** When the user lets go, or steps with the keys: the time to play from. */
    onSeek: (time: number) => void;
}
