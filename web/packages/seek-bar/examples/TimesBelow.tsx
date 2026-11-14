import { SeekBar, useMediaPlayer } from '@rinzai/zen';

import { useDemoTrack } from '../../player-bar/examples/demo-track';

/** The times under the bar's ends, as on a phone's Now Playing screen. */
export default function TimesBelow() {
    const src = useDemoTrack();
    const [audioRef, player] = useMediaPlayer();
    return (
        <div className="w-80">
            <audio ref={audioRef} src={src} preload="metadata" />
            <SeekBar
                times="below"
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
