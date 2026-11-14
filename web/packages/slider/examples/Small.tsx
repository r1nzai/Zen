import { Button, Slider } from '@rinzai/zen';
import SpeakerWave from '@zen/icons/speaker-wave';
import SpeakerXMark from '@zen/icons/speaker-x-mark';
import { useState } from 'react';

/** size="sm": a thin track and a small thumb, for a compact control like a player's volume. Still 20px tall to grab. */
export default function Small() {
    const [volume, setVolume] = useState(70);
    const [muted, setMuted] = useState(false);
    return (
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label={muted ? 'Unmute' : 'Mute'}
                onClick={() => setMuted(!muted)}
            >
                {muted ? <SpeakerXMark className="size-4" /> : <SpeakerWave className="size-4" />}
            </Button>
            <Slider
                size="sm"
                aria-label="Volume"
                className="w-28"
                value={muted ? 0 : volume}
                onValueChange={(v) => {
                    setVolume(v);
                    setMuted(v === 0);
                }}
                valueText={(v) => `${v} percent`}
            />
        </div>
    );
}
