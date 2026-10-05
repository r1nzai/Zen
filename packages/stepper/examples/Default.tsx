import { Button, Step, Stepper } from '@rinzai/zen';
import { useState } from 'react';

/** Importing a statement in three steps. */
export default function Default() {
    const [step, setStep] = useState(1);
    return (
        <div className="flex w-full max-w-lg flex-col items-center gap-8">
            <Stepper value={step}>
                <Step description="CSV or Excel">Upload</Step>
                <Step description="Match the columns">Map</Step>
                <Step description="Check and import">Review</Step>
            </Stepper>
            <div className="flex gap-2">
                <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
                    Back
                </Button>
                <Button disabled={step === 3} onClick={() => setStep(step + 1)}>
                    {step >= 2 ? 'Import' : 'Next'}
                </Button>
            </div>
        </div>
    );
}
