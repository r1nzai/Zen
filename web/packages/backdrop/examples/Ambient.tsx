import { Card, CardTitle, Input, Stat } from '@rinzai/zen';

/**
 * For a page that never gets a pointer, such as an OBS browser source: `data-zen-glow="ambient"`
 * sends the edge light slowly round each border by itself. Put it on `<html>` for the whole page, or
 * on any element for what's inside it. `data-zen-page="transparent"` on `<html>` (with the base
 * stylesheet) paints nothing behind the content, so the stream shows through.
 */
export default function Ambient() {
    return (
        <div data-zen-glow="ambient" className="flex flex-wrap items-start gap-4 p-4">
            <Stat label="Now playing" value="Lo-fi beats" className="w-56" />
            <Card className="w-64">
                <CardTitle className="mb-3">Chat</CardTitle>
                <Input placeholder="Say something" aria-label="Message" />
            </Card>
        </div>
    );
}
