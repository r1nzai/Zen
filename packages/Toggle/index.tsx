import {cx} from "@zen/utils/cx";
import HTML from "packages/component";
import {BaseProps} from "@zen/component/component.types";
import Container from "@zen/container";

interface ToggleProps extends Omit<BaseProps<"input">, "onChange"> {
    onChange: (e: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const {className, checked, onChange, ...rest} = props;
    return (
        <HTML tag={"div"}
            className={cx(
                "rounded-full",
                "w-10 h-5",
                "bg-secondary border border-muted",
                "flex items-center", className
            )}
            onClick={() => {
                onChange(!checked);
            }}
        >
            <HTML tag={"input"}
                type="checkbox"
                className={cx("hidden")}
                checked={checked}
                onChange={() => {
                }}
                {...rest}
            />
            <Container
                className={cx(
                    "rounded-full w-4 h-4 bg-primary transition",
                    checked ? "translate-x-5" : "translate-x-1",
                )}
            />
        </HTML>
    );
}