import { Button, InputGroup, InputGroupAddon, InputGroupInput, useCopyToClipboard } from '@rinzai/zen';
import { useRef } from 'react';

const LINK = 'https://zen.rinzai.dev/components/code-block/';

/**
 * A copy button of your own, with the hook CodeBlock copies with: `copy` resolves false when the
 * browser won't copy, and here the link is then selected to copy by hand.
 */
export default function CopyButton() {
    const { copy, copied } = useCopyToClipboard();
    const input = useRef<HTMLInputElement>(null);
    return (
        <InputGroup className="w-full max-w-sm pr-1">
            <InputGroupInput ref={input} value={LINK} readOnly aria-label="Link" />
            <InputGroupAddon>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7"
                    onClick={async () => {
                        if (await copy(LINK)) return;
                        input.current?.focus();
                        input.current?.select();
                    }}
                >
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </InputGroupAddon>
        </InputGroup>
    );
}
