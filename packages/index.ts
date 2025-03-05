import './index.css';
export { default as Badge } from './badge';
export { default as Button } from './button';
export { default as Collapse } from './collapse';
export { default as Dropdown } from './dropdown';
export * from './icons';
export { default as Input } from './input';
export { default as Popover } from './popover';
export { default as Toggle } from './toggle';
export { default as TextArea } from './textarea';
export { cva, type VariantProps } from './utils/cva';
export { cx } from './utils/cx';
import 'react';

declare module 'react' {
    interface CSSProperties {
        [key: `--${string}`]: string | number;
    }
}
