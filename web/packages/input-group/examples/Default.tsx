import { InputGroup, InputGroupAddon, InputGroupInput } from '@rinzai/zen';
import Search from '@zen/icons/search';

export default function Default() {
    return (
        <div className="flex w-80 flex-col gap-3">
            <InputGroup>
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupInput placeholder="Search entries" />
            </InputGroup>
            <InputGroup>
                <InputGroupAddon>https://</InputGroupAddon>
                <InputGroupInput placeholder="zen.rinzai" />
                <InputGroupAddon>.dev</InputGroupAddon>
            </InputGroup>
            <InputGroup>
                <InputGroupInput placeholder="72" inputMode="numeric" className="tabular-nums" />
                <InputGroupAddon>kg</InputGroupAddon>
            </InputGroup>
        </div>
    );
}
