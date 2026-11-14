import { ProgressRing } from '@rinzai/zen';

export default function Default() {
    return (
        <div className="flex items-center gap-6">
            {[0.28, 0.64, 1].map((value) => (
                <ProgressRing key={value} value={value} label={`${Math.round(value * 100)}% saved`}>
                    <span className="text-sm font-semibold tabular-nums">{Math.round(value * 100)}%</span>
                </ProgressRing>
            ))}
        </div>
    );
}
