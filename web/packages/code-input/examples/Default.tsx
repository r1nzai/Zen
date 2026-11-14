import { CodeInput, Field } from '@rinzai/zen';
import { useState } from 'react';

/** A six-digit sign-in code, checked as soon as it's complete. */
export default function Default() {
    const [code, setCode] = useState('');
    const [checked, setChecked] = useState<string>();
    return (
        <Field label="Sign-in code" hint={checked ? `Checking ${checked}…` : 'We sent it to your phone.'}>
            <CodeInput
                value={code}
                onValueChange={(next) => {
                    setCode(next);
                    setChecked(undefined);
                }}
                onComplete={setChecked}
            />
        </Field>
    );
}
