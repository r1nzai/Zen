import { Input } from '@rinzai/zen';

export default function States() {
    return (
        <div className="flex w-72 flex-col gap-3">
            <Input aria-label="Empty" placeholder="Placeholder" />
            <Input aria-label="Filled" defaultValue="With a value" />
            <Input aria-label="Disabled" defaultValue="Disabled" disabled />
        </div>
    );
}
