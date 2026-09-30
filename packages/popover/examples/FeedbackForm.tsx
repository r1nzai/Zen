import { Button, Input, Popover, PopoverClose, PopoverContent, PopoverTrigger, TextArea } from '@rinzai/zen';

export default function FeedbackForm() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">Give feedback</Button>
            </PopoverTrigger>
            <PopoverContent aria-labelledby="feedback-title">
                <div className="flex w-72 flex-col gap-3 p-4">
                    <p id="feedback-title" className="text-sm font-semibold">
                        Send feedback
                    </p>
                    <Input placeholder="Subject" />
                    <TextArea placeholder="Describe your feedback…" className="resize-none" />
                    <div className="flex justify-end gap-2">
                        <PopoverClose variant="outline" size="sm">
                            Cancel
                        </PopoverClose>
                        <Button size="sm">Submit</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
