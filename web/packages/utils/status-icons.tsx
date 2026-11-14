import CheckMicro from '@zen/icons/micro/check';
import ExclamationTriangleMicro from '@zen/icons/micro/exclamation-triangle';
import InformationCircleMicro from '@zen/icons/micro/information-circle';

import { cx } from './cx';

/** Small status icons in the current text colour (toasts, field errors): Heroicons' micro set. */
export function CheckIcon({ className }: { className?: string }) {
    return <CheckMicro className={cx('size-3.5', className)} />;
}

export function AlertIcon({ className }: { className?: string }) {
    return <ExclamationTriangleMicro className={cx('size-3.5', className)} />;
}

export function InfoIcon({ className }: { className?: string }) {
    return <InformationCircleMicro className={cx('size-3.5', className)} />;
}
