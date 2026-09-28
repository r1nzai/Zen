import { Button, Field, FormMessage, Input } from '@rinzai/zen';
import { FormEvent, useState } from 'react';

/** Field links the label, hint and error to its control; FormMessage speaks for the whole form. */
export default function Default() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const invalid = submitted && !email.includes('@');
    return (
        <form
            className="flex w-80 flex-col gap-4"
            noValidate
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                setSubmitted(true);
            }}
        >
            <Field
                label="Email"
                hint="We'll send a sign-in link."
                error={invalid ? 'Enter an email address.' : undefined}
            >
                <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />
            </Field>
            {submitted && !invalid && <FormMessage tone="success">Check your inbox for the link.</FormMessage>}
            <Button type="submit" className="self-start">
                Send link
            </Button>
        </form>
    );
}
