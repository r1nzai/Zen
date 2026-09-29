import IconProps from './icon.types';

/** "⋯": more actions. 16px by default. */
export default function Ellipsis(props: IconProps) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" className="size-4" aria-hidden {...props}>
            <circle cx="3" cy="8" r="1.4" />
            <circle cx="8" cy="8" r="1.4" />
            <circle cx="13" cy="8" r="1.4" />
        </svg>
    );
}
