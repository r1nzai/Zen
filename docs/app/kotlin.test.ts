import { describe, expect, it } from 'vite-plus/test';

import { formatSignature } from './kotlin';

describe('Kotlin signatures', () => {
    it('puts a long declaration’s parameters a line each, nested types and defaults whole', () => {
        expect(
            formatSignature(
                'fun Button(onClick: () -> Unit, modifier: Modifier = Modifier, source: MutableInteractionSource = remember { MutableInteractionSource() }, content: RowScope.() -> Unit)',
            ),
        ).toBe(
            [
                'fun Button(',
                '    onClick: () -> Unit,',
                '    modifier: Modifier = Modifier,',
                '    source: MutableInteractionSource = remember { MutableInteractionSource() },',
                '    content: RowScope.() -> Unit,',
                ')',
            ].join('\n'),
        );
    });

    it('keeps a short one, and a class, as they are', () => {
        expect(formatSignature('fun Kbd(key: String)')).toBe('fun Kbd(key: String)');
        expect(formatSignature('ButtonVariant')).toBe('ButtonVariant');
    });

    it('keeps what follows the parameters: a return type', () => {
        expect(formatSignature('fun rememberFilePicker(accept: String? = null, multiple: Boolean = false, onFiles: (List<PickedFile>) -> Unit): () -> Unit')).toBe(
            [
                'fun rememberFilePicker(',
                '    accept: String? = null,',
                '    multiple: Boolean = false,',
                '    onFiles: (List<PickedFile>) -> Unit,',
                '): () -> Unit',
            ].join('\n'),
        );
    });
});
