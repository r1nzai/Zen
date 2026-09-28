import { cx } from '@zen/utils/cx';
import { ReactNode } from 'react';

/** Circular progress, 0–1, with optional content in the middle. */
export default function ProgressRing({ value, size = 84, stroke = 7, label, children, className }: ProgressRingProps) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const v = Math.min(Math.max(value, 0), 1);
    return (
        <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(v * 100)}
            className={cx('zen__progress-ring relative grid shrink-0 place-items-center', className)}
            style={{ width: size, height: size }}
        >
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    className="stroke-tint/[0.07]"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    strokeDashoffset={c * (1 - v)}
                    className="stroke-primary [filter:drop-shadow(0_0_6px_oklch(var(--glow)/0.45))] transition-[stroke-dashoffset] duration-700 ease-out"
                />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
        </div>
    );
}

export interface ProgressRingProps {
    /** Progress from 0 to 1; values outside are clamped. */
    value: number;
    size?: number;
    stroke?: number;
    /** Accessible name, e.g. "Savings goal". */
    label: string;
    children?: ReactNode;
    className?: string;
}
