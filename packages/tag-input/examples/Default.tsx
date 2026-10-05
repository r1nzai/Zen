import { Field, TagInput } from '@rinzai/zen';
import { useState } from 'react';

/** An entry's labels. Type one and press Enter or a comma; paste a list to add each. */
export default function Default() {
    const [tags, setTags] = useState(['groceries', 'weekly']);
    return (
        <Field label="Labels" hint="Press Enter or a comma after each." className="w-full max-w-sm">
            <TagInput value={tags} onValueChange={setTags} placeholder="Add a label" />
        </Field>
    );
}
