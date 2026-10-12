import { applyTheme, Badge, Button, ColorPicker, customize, DEFAULT_THEME, Field, hexToOklch } from '@rinzai/zen';
import { useEffect, useRef, useState } from 'react';

/** `hexToOklch` gives a picked colour's hue to the theme engine, which keeps it readable in dark and light. */
export default function Accent() {
    const [color, setColor] = useState('#2bb3a3');
    const preview = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const oklch = hexToOklch(color);
        const root = document.documentElement;
        const apply = () =>
            oklch &&
            preview.current &&
            applyTheme(customize(DEFAULT_THEME, { hue: Math.round(oklch.h) }), {
                appearance: root.classList.contains('light') ? 'light' : 'dark',
                target: preview.current,
            });
        apply();
        const watch = new MutationObserver(apply);
        watch.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => watch.disconnect();
    }, [color]);
    return (
        <div className="flex flex-wrap items-end gap-6">
            <Field label="Accent" className="w-56">
                <ColorPicker value={color} onValueChange={setColor} />
            </Field>
            <div ref={preview} className="flex items-center gap-3">
                <Button>Save</Button>
                <Badge>New</Badge>
            </div>
        </div>
    );
}
