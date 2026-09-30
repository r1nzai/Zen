import { Checkbox } from '@rinzai/zen';
import { useState } from 'react';

/** With a label and a description; the tick draws itself in. */
export default function Default() {
    const [remind, setRemind] = useState(true);
    const [share, setShare] = useState(false);
    return (
        <div className="flex flex-col gap-4">
            <Checkbox checked={remind} onChange={setRemind} description="A nudge on the 1st of each month.">
                Remind me to log spending
            </Checkbox>
            <Checkbox checked={share} onChange={setShare}>
                Share anonymous usage data
            </Checkbox>
            <Checkbox disabled>Sync to the cloud (coming soon)</Checkbox>
        </div>
    );
}
