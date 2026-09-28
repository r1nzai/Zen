import { render, screen } from '@testing-library/react';

import Avatar, { cropImageToSquare, ImageCropError } from './index';

describe('Avatar', () => {
    it('shows the initial without an image, hidden from screen readers', () => {
        const { container } = render(<Avatar name="rin@example.com" />);
        expect(container.firstChild).toHaveTextContent('R');
        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });

    it('shows the image, and is announced with alt', () => {
        render(<Avatar name="Rin" src="/me.webp" alt="Rin's profile picture" />);
        const avatar = screen.getByRole('img', { name: "Rin's profile picture" });
        expect(avatar.querySelector('img')).toHaveAttribute('src', '/me.webp');
    });

    it('refuses non-images for cropping', async () => {
        await expect(cropImageToSquare(new Blob(['x'], { type: 'text/plain' }))).rejects.toBeInstanceOf(ImageCropError);
    });

    it('takes any size, smaller or larger than the default', () => {
        const { container, rerender } = render(<Avatar name="Rin" />);
        expect(container.firstChild).toHaveClass('size-9', 'text-sm');
        rerender(<Avatar name="Rin" className="size-7 text-xs" />);
        expect(container.firstChild).not.toHaveClass('size-9');
        expect(container.firstChild).not.toHaveClass('text-sm');
        expect(container.firstChild).toHaveClass('size-7', 'text-xs');
    });
});
