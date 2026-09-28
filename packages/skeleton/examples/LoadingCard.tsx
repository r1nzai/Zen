import { Skeleton } from '@rinzai/zen';

export default function LoadingCard() {
    return (
        <div className="glass flex w-80 flex-col gap-3 rounded-xl p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-3 w-full" />
        </div>
    );
}
