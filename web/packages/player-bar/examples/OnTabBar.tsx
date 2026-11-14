import { Button, PlayerBar, TabBar, TabBarItem, useMediaPlayer } from '@rinzai/zen';
import Pause from '@zen/icons/pause';
import Play from '@zen/icons/play';
import Search from '@zen/icons/search';
import Squares from '@zen/icons/squares';
import ListBullet from '@zen/icons/list-bullet';

import { useDemoTrack } from './demo-track';

/**
 * On a phone, it sits on the TabBar beside it, and the page pads its end by
 * both bars' heights (--zen-tab-bar-height and --zen-player-bar-height).
 */
export default function OnTabBar() {
    const src = useDemoTrack();
    const [audioRef, player] = useMediaPlayer();
    const progress = player.duration ? (player.currentTime / player.duration) * 100 : 0;
    return (
        <div className="border-tint/10 relative h-96 w-80 [transform:translateZ(0)] overflow-hidden rounded-2xl border">
            <audio ref={audioRef} src={src} preload="metadata" />
            <div className="h-full overflow-y-auto p-4 pb-[calc(var(--zen-tab-bar-height,0px)+var(--zen-player-bar-height,0px))]">
                <p className="text-muted-foreground text-sm">Home</p>
            </div>
            <PlayerBar aria-label="Now playing" className="absolute! gap-3 px-3 pt-2 pb-2">
                <div className="from-primary size-9 shrink-0 rounded-md bg-linear-135 to-fuchsia-400" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Glass Aurora</p>
                    <p className="text-muted-foreground truncate text-xs">Zen</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={player.playing ? 'Pause' : 'Play'}
                    disabled={!src}
                    onClick={() => player.toggle()}
                >
                    {player.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
                </Button>
                <span
                    aria-hidden
                    className="bg-primary absolute start-0 bottom-0 h-0.5 shadow-[0_0_8px_oklch(var(--glow)/calc(0.8*var(--glow-k)))]"
                    style={{ width: `${progress}%` }}
                />
            </PlayerBar>
            <TabBar aria-label="Main" hideFrom={false} className="absolute! rounded-b-[15px]">
                <TabBarItem href="#home" icon={<Squares />} active onClick={(e) => e.preventDefault()}>
                    Home
                </TabBarItem>
                <TabBarItem href="#search" icon={<Search />} onClick={(e) => e.preventDefault()}>
                    Search
                </TabBarItem>
                <TabBarItem href="#library" icon={<ListBullet />} onClick={(e) => e.preventDefault()}>
                    Library
                </TabBarItem>
            </TabBar>
        </div>
    );
}
