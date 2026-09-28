import { Backdrop, Button, Card } from '@rinzai/zen';

import topo from './topo.svg';

export default function Contours() {
    return (
        // Backdrop is fixed to the viewport; the transform keeps it inside this frame for the demo.
        <div className="relative h-96 w-full [transform:translateZ(0)] overflow-hidden rounded-xl">
            <Backdrop topoSrc={topo} />
            <div className="flex h-full items-center justify-center p-8">
                <Card title="Move the pointer" className="w-72">
                    <p className="text-muted-foreground mt-0! mb-4 text-sm">
                        Card edges and the contour lines light up near it.
                    </p>
                    <Button variant="outline">Outline buttons too</Button>
                </Card>
            </div>
        </div>
    );
}
