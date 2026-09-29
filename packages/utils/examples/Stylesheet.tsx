import { applyPreset, CodeBlock, DEFAULT_THEME, Segmented, SegmentedItem, themeVars } from '@rinzai/zen';
import { useState } from 'react';

const css = (vars: Record<string, string>) =>
    Object.entries(vars)
        .map(([k, v]) => `    --${k}: ${v};`)
        .join('\n');

/**
 * No script needed: themeVars gives the tokens as data, so a theme can be
 * written into a stylesheet at build time or on the server.
 */
export default function Stylesheet() {
    const [preset, setPreset] = useState<'teal' | 'amber'>('teal');
    const theme = applyPreset(DEFAULT_THEME, preset);
    const code = `:root, .dark {\n${css(themeVars(theme, 'dark'))}\n}\n.light {\n${css(themeVars(theme, 'light'))}\n}`;
    return (
        <div className="flex w-full max-w-2xl flex-col gap-3">
            <Segmented label="Preset" value={preset} onChange={setPreset}>
                <SegmentedItem value="teal">Teal</SegmentedItem>
                <SegmentedItem value="amber">Amber</SegmentedItem>
            </Segmented>
            <CodeBlock code={code} language="css" className="max-h-72 overflow-auto" />
        </div>
    );
}
