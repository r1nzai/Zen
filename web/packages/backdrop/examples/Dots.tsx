import { Backdrop, Stat } from '@rinzai/zen';

export default function Dots() {
    return (
        // Backdrop is fixed to the viewport; the transform keeps it inside this frame for the demo.
        <div className="relative h-96 w-full [transform:translateZ(0)] overflow-hidden rounded-xl">
            <Backdrop pattern="dots" />
            <div className="flex h-full items-center justify-center p-8">
                <Stat label="Net this month" value="$3,330" tone="positive" className="w-60" />
            </div>
        </div>
    );
}
