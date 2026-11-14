import { Button, Spinner, StatusPill, StatusPillAction } from '@rinzai/zen';
import AlertTriangle from '@zen/icons/micro/exclamation-triangle';
import Check from '@zen/icons/micro/check';
import { useEffect, useState } from 'react';

type Save = 'saving' | 'saved' | 'error';

/** A save indicator: saving spins, saved checks and then quietens, a failure is red and offers a retry. */
export default function Save() {
    const [state, setState] = useState<Save>('saved');
    const [quiet, setQuiet] = useState(false);
    useEffect(() => {
        setQuiet(false);
        if (state !== 'saved') return;
        const t = window.setTimeout(() => setQuiet(true), 2500);
        return () => window.clearTimeout(t);
    }, [state]);
    const save = (ok: boolean) => {
        setState('saving');
        window.setTimeout(() => setState(ok ? 'saved' : 'error'), 1200);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {state === 'error' ? (
                <StatusPill tone="negative">
                    <AlertTriangle />
                    Not saved
                    <StatusPillAction onClick={() => save(true)}>Retry</StatusPillAction>
                </StatusPill>
            ) : (
                <StatusPill tone={state === 'saved' ? 'positive' : 'default'} quiet={state === 'saved' && quiet}>
                    {state === 'saving' ? <Spinner /> : <Check />}
                    {state === 'saving' ? 'Saving…' : 'Saved'}
                </StatusPill>
            )}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => save(true)}>
                    Save
                </Button>
                <Button variant="outline" size="sm" onClick={() => save(false)}>
                    Save and fail
                </Button>
            </div>
        </div>
    );
}
