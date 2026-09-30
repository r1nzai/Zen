import { Backdrop, Button, Card, CardHeader, CardTitle } from '@rinzai/zen';

import topo from './topo.svg';

export default function Contours() {
    return (
        // Backdrop is fixed to the viewport; the transform keeps it inside this frame for the demo.
        <div className="relative h-96 w-full [transform:translateZ(0)] overflow-hidden rounded-xl">
            <Backdrop topoSrc={topo} />
            <div className="flex h-full items-center justify-center p-8">
                <Card className="w-72">
                    <CardHeader>
                        <CardTitle>Move the pointer</CardTitle>
                    </CardHeader>
                    <p className="text-muted-foreground mt-0! mb-4 text-sm">
                        Card edges and the contour lines light up near it.
                    </p>
                    <Button variant="outline">Outline buttons too</Button>
                </Card>
            </div>
        </div>
    );
}
