import { Button } from '@rinzai/zen';

/** asChild puts the button's styles on your own element, here a link (a router's Link works the same way). */
export default function AsLink() {
    return (
        <div className="flex gap-3">
            <Button asChild>
                <a href="#get-started">Get started</a>
            </Button>
            <Button asChild variant="outline">
                <a href="#docs">Read the docs</a>
            </Button>
        </div>
    );
}
