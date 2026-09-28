import 'react';
import './index.css';
export { default as ActionsMenu, type Action } from './actions-menu';
export { default as Backdrop } from './backdrop';
export { default as Badge } from './badge';
export { default as Button, buttonVariants } from './button';
export { default as Card, Stat, StatRow } from './card';
export { default as CodeBlock } from './code-block';
export { default as Collapse } from './collapse';
export { default as ConfirmDialog } from './confirm-dialog';
export { default as Dialog } from './dialog';
export { default as Dropdown, type DropdownItem } from './dropdown';
export { default as Header } from './header';
export * from './icons';
export { default as Input } from './input';
export { default as NavPills, NavPill, NavPillIndicator } from './nav-pills';
export { default as PageHeader } from './page-header';
export { default as Popover } from './popover';
export { default as ProgressRing } from './progress-ring';
export { default as Segmented } from './segmented';
export { default as SideNav, SideNavGroup, SideNavLink } from './side-nav';
export { default as Skeleton } from './skeleton';
export { default as Spinner } from './spinner';
export { default as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
export { default as TableOfContents, type TableOfContentsItem } from './table-of-contents';
export { default as Tabs, Tab, TabList, TabPanel } from './tabs';
export { default as TextArea } from './textarea';
export { default as ToastProvider, useToast, type ToastOptions, type ToastTone } from './toast';
export { default as Toggle } from './toggle';
export { default as ThemeToggle, ThemeScript, themeScript } from './theme-toggle';
export { cva, type VariantProps } from './utils/cva';
export { cx } from './utils/cx';

declare module 'react' {
    interface CSSProperties {
        [key: `--${string}`]: string | number;
    }
}
