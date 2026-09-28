import { cx } from '@zen/utils/cx';
import { formatMoney, type Money } from '@zen/utils/money';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const ease = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that counts smoothly to each new value (and up from zero when it
 * first appears). Rounds to whole numbers while moving, so money in minor
 * units never shows fractions. Instant with reduced motion.
 */
export default function AnimatedNumber({
    value,
    format = String,
    duration = 650,
    fromZero = true,
    className,
}: AnimatedNumberProps) {
    const [shown, setShown] = useState(fromZero ? 0 : value);
    const current = useRef(fromZero ? 0 : value);

    useIsoLayoutEffect(() => {
        const reduced =
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
            document.documentElement.classList.contains('reduce-motion');
        if (reduced || duration <= 0) {
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
    }, [value, duration]);

    return <span className={cx('zen__animated-number tabular-nums', className)}>{format(shown)}</span>;
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
    className?: string;
}
