import { Avatar, Button, cropImageToSquare, ImageCropError } from '@rinzai/zen';
import { useRef, useState } from 'react';

/** cropImageToSquare centres, crops and shrinks a chosen image in the browser to a small data URL. */
export default function Upload() {
    const [src, setSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const input = useRef<HTMLInputElement>(null);
    return (
        <div className="flex items-center gap-4">
            <Avatar name="You" src={src} className="size-16 text-xl" />
            <div className="flex flex-col gap-1">
                <Button variant="outline" size="sm" onClick={() => input.current?.click()}>
                    Choose a picture
                </Button>
                {error && <span className="text-destructive text-xs">{error}</span>}
            </div>
            <input
                ref={input}
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                        setSrc(await cropImageToSquare(file, 160));
                        setError(null);
                    } catch (err) {
                        setError(err instanceof ImageCropError ? err.message : 'Something went wrong.');
                    }
                }}
            />
        </div>
    );
}
