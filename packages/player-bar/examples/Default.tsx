import { Button, PlayerBar, SeekBar, Slider, useMediaPlayer, useMediaSession } from '@rinzai/zen';
import Backward from '@zen/icons/backward';
import Pause from '@zen/icons/pause';
import Play from '@zen/icons/play';
import SpeakerWave from '@zen/icons/speaker-wave';
import SpeakerXMark from '@zen/icons/speaker-x-mark';

import { useDemoTrack } from './demo-track';

/**
 * Your own <audio>, driven by useMediaPlayer: the cover and title, the controls
 * over a SeekBar, and the volume. useMediaSession puts it on the lock screen
 * and the media keys. Fixed to the bottom of the screen; here it sits in a frame.
 */
export default function Default() {
    const src = useDemoTrack();
    const [audioRef, player] = useMediaPlayer();
    useMediaSession(player, { title: 'Glass Aurora', artist: 'Zen' });
    return (
        <div className="border-tint/10 relative h-48 w-full [transform:translateZ(0)] overflow-hidden rounded-2xl border">
            <audio ref={audioRef} src={src} preload="metadata" />
            <PlayerBar aria-label="Now playing" className="absolute! justify-between rounded-b-[15px]">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="from-primary size-11 shrink-0 rounded-lg bg-linear-135 to-fuchsia-400" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">Glass Aurora</p>
                        <p className="text-muted-foreground truncate text-xs">Zen</p>
                    </div>
                </div>
                <div className="flex flex-[2] flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-sm" aria-label="Restart" onClick={() => player.seek(0)}>
                            <Backward className="size-4" />
                        </Button>
                        <Button
                            size="icon"
                            className="rounded-full"
                            aria-label={player.playing ? 'Pause' : 'Play'}
                            disabled={!src}
                            onClick={() => player.toggle()}
                        >
                            {player.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
                        </Button>
                    </div>
                    <SeekBar
                        className="w-full"
                        currentTime={player.currentTime}
                        playing={player.playing && !player.waiting}
                        playbackRate={player.playbackRate}
                        duration={player.duration}
                        buffered={player.buffered}
                        onSeek={player.seek}
                    />
                </div>
                <div className="hidden flex-1 items-center justify-end gap-2 sm:flex">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={player.muted ? 'Unmute' : 'Mute'}
                        onClick={() => player.setMuted(!player.muted)}
                    >
                        {player.muted ? <SpeakerXMark className="size-4" /> : <SpeakerWave className="size-4" />}
                    </Button>
                    <Slider
                        aria-label="Volume"
                        className="w-24"
                        value={player.muted ? 0 : Math.round(player.volume * 100)}
                        onValueChange={(v) => {
                            player.setVolume(v / 100);
                            if (v > 0 && player.muted) player.setMuted(false);
                        }}
                    />
                </div>
            </PlayerBar>
        </div>
    );
}
