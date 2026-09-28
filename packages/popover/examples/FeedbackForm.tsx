import { Button, Input, Popover, TextArea } from '@rinzai/zen';

export default function FeedbackForm() {
    return (
        <Popover
            role="dialog"
            content={
                <div className="flex w-72 flex-col gap-3 p-4">
                    <p className="text-sm font-semibold">Send feedback</p>
                    <Input placeholder="Subject" />
                    <TextArea placeholder="Describe your feedback…" className="resize-none" />
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                            Cancel
                        </Button>
                        <Button size="sm">Submit</Button>
                    </div>
                </div>
            }
        >
            <Button variant="outline">Give feedback</Button>
        </Popover>
    );
}
