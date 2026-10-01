import { cx } from '@zen/utils/cx';

/**
 * Round profile picture; without an image, the name's initial on the glowing
 * accent. Decorative (hidden from screen readers) unless you give it `alt`.
 */
export default function Avatar({ src, name, alt, className }: AvatarProps) {
    const initial = (name.trim()[0] ?? '?').toUpperCase();
    return (
        <span
            role={alt ? 'img' : undefined}
            aria-label={alt}
            aria-hidden={alt ? undefined : true}
            className={cx(
                'zen__avatar relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none',
                'size-9 text-sm',
                'text-primary-foreground bg-[radial-gradient(circle_at_30%_25%,oklch(var(--glow)/0.9),oklch(var(--primary)/0.55))]',
                'shadow-[0_0_0_1px_oklch(var(--tint)/0.12),0_0_18px_-6px_oklch(var(--glow)/calc(0.9*var(--glow-strength)))]',
                className,
            )}
        >
            {/* The initial stays under a photo, unseen: the avatar then sits on a line (in a button,
                next to text) by the initial's baseline either way, not by the photo's bottom edge. */}
            <span className={src ? 'invisible' : undefined}>{initial}</span>
            {src && <img src={src} alt="" className="absolute inset-0 size-full object-cover" draggable={false} />}
        </span>
    );
}

export class ImageCropError extends Error {}

/**
 * Crops an image file to a centred square and resizes it in the browser (to
 * `size` px), returning a small data URL (WebP where supported, else JPEG).
 * Handy for profile pictures you store yourself.
 */
export async function cropImageToSquare(file: Blob, size = 160, quality = 0.85): Promise<string> {
    if (!file.type.startsWith('image/')) throw new ImageCropError('Choose an image file.');
    if (file.size > 20 * 1024 * 1024) throw new ImageCropError('That image is too large (over 20 MB).');
    let bitmap: ImageBitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        throw new ImageCropError("That image couldn't be read.");
    }
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);
    bitmap.close();
    const webp = canvas.toDataURL('image/webp', quality);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}

export interface AvatarProps {
    /** Image URL (or data URL); without it, the initial is shown. */
    src?: string | null;
    /** Name or email, for the initial. */
    name: string;
    /** Accessible name; leave out when the name is shown next to the avatar. */
    alt?: string;
    /** Size and more, e.g. "size-12 text-lg" (default size-9). */
    className?: string;
}
