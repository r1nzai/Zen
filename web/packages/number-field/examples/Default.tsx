import { Field, NumberField } from '@rinzai/zen';

/** Type, use − and +, or ↑↓: kept between 1 and 12. */
export default function Default() {
    return (
        <Field label="Split between" hint="People sharing the bill" className="w-56">
            <NumberField defaultValue={2} min={1} max={12} />
        </Field>
    );
}
