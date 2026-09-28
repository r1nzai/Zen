import { Input } from '@rinzai/zen';

export default function States() {
    return (
        <div className="flex w-72 flex-col gap-3">
            <Input placeholder="Placeholder" />
            <Input defaultValue="With a value" />
            <Input defaultValue="Disabled" disabled />
        </div>
    );
}
