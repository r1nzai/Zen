import { Button, SeekBar, useMediaPlayer } from '@rinzai/zen';
import Pause from '@zen/icons/pause';
import Play from '@zen/icons/play';

import { useDemoTrack } from '../../player-bar/examples/demo-track';

/** Filled to the time played, shaded on to what's loaded. Drag it: the track plays on, and seeks when you let go. */
export default function Default() {
    const src = useDemoTrack();
    const [audioRef, player] = useMediaPlayer();
    return (
        <div className="flex w-96 items-center gap-3">
            <audio ref={audioRef} src={src} preload="metadata" />
            <Button
                size="icon-sm"
                className="rounded-full"
                aria-label={player.playing ? 'Pause' : 'Play'}
                disabled={!src}
                onClick={() => player.toggle()}
            >
                {player.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
            </Button>
            <SeekBar
                className="flex-1"
                currentTime={player.currentTime}
                playing={player.playing && !player.waiting}
                playbackRate={player.playbackRate}
                duration={player.duration}
                buffered={player.buffered}
                onSeek={player.seek}
            />
        </div>
    );
}
