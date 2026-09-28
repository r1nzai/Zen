import { Button, Popover } from '@rinzai/zen';
import { useState } from 'react';

/** `triggerType="manual"`: your state decides when it shows. */
export default function Controlled() {
    const [show, setShow] = useState(false);
    return (
        <Popover
            triggerType="manual"
            show={show}
            setShow={setShow}
            role="dialog"
            content={
                <div className="flex flex-col gap-2 p-3 text-sm">
                    <p className="font-medium">Manually controlled</p>
                    <Button size="sm" variant="secondary" onClick={() => setShow(false)}>
                        Close
                    </Button>
                </div>
            }
        >
            <Button>{show ? 'Hide' : 'Show'} popover</Button>
        </Popover>
    );
}
