import { cx } from '@zen/utils/cx';
import { formatMoney, type Money } from '@zen/utils/money';
import { reducedMotion } from '@zen/utils/motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that counts smoothly to each new value (and up from zero when it
 * first appears). Rounds to whole numbers while moving, so money in minor
 * units never shows fractions. With `roll`, each digit rolls to its new one
 * instead, like an odometer: easier to read when a total changes. Instant
 * with reduced motion.
 */
export default function AnimatedNumber({
    value,
    format = String,
    duration = 650,
    fromZero = true,
    roll = false,
    className,
}: AnimatedNumberProps) {
    const [shown, setShown] = useState(fromZero ? 0 : value);
    const current = useRef(fromZero ? 0 : value);
    // Rolling: the digits show 0 until the first frame is painted, then roll to theirs.
    const [arrived, setArrived] = useState(!fromZero);
    useEffect(() => {
        if (!roll || arrived) return;
        const frame = requestAnimationFrame(() => setArrived(true));
        return () => cancelAnimationFrame(frame);
    }, [roll, arrived]);

    useIsoLayoutEffect(() => {
        if (roll) return;
        if (reducedMotion() || duration <= 0) {
            current.current = value;
            setShown(value);
            return;
        }
        const from = current.current;
        const start = performance.now();
        let frame = requestAnimationFrame(function tick(now) {
            const t = Math.min(1, (now - start) / duration);
            const v = Math.round(from + (value - from) * ease(t));
            current.current = v;
            setShown(v);
            if (t < 1) frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [value, duration, roll]);

    if (roll) {
        const text = format(value);
        return (
            <span className={cx('zen__animated-number inline-flex items-start tabular-nums', className)}>
                <span className="sr-only">{text}</span>
                <span aria-hidden className="inline-flex items-start">
                    {text.split('').map((ch, i) =>
                        // Keyed from the right, so the ones stay the ones when the number grows a digit.
                        /\d/.test(ch) ? (
                            <Digit key={text.length - i} digit={arrived ? Number(ch) : 0} duration={duration} />
                        ) : (
                            <span key={text.length - i}>{ch}</span>
                        ),
                    )}
                </span>
            </span>
        );
    }
    return <span className={cx('zen__animated-number tabular-nums', className)}>{format(shown)}</span>;
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** One place of a rolling number: a strip of 0–9 behind a one-line window. */
function Digit({ digit, duration }: { digit: number; duration: number }) {
    return (
        <span className="inline-block h-[1lh] overflow-hidden">
            <span
                className="zen__digit ease-out-soft flex flex-col transition-[translate]"
                style={{ translate: `0 ${-digit * 10}%`, transitionDuration: `${duration}ms` }}
            >
                {DIGITS.map((d) => (
                    <span key={d}>{d}</span>
                ))}
            </span>
        </span>
    );
}

/** An amount of money (minor units) that counts to each new value. */
export function AnimatedMoney({
    value,
    currency,
    locale,
    showDecimals = false,
    ...rest
}: Omit<AnimatedNumberProps, 'format' | 'value'> & {
    value: Money;
    currency: string;
    locale: string;
    showDecimals?: boolean;
}) {
    return (
        <AnimatedNumber value={value} format={(v) => formatMoney(v, currency, locale, { showDecimals })} {...rest} />
    );
}

export interface AnimatedNumberProps {
    value: number;
    /** Turns the (whole) number into text, e.g. with Intl.NumberFormat. */
    format?: (value: number) => string;
    /** Milliseconds per change. */
    duration?: number;
    /** Count up from zero when first shown (default), or start at the value. */
    fromZero?: boolean;
    /** Roll each digit to its new one, like an odometer, instead of counting. */
    roll?: boolean;
    className?: string;
}
