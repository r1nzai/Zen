import { mergeClasses } from './merge';

/**
 * Joins class names (strings, arrays, { name: condition } objects), skipping
 * falsy ones. Conflicting Tailwind classes resolve to the last one, so a
 * className passed in overrides a component's defaults (see mergeClasses).
 */
export const cx = (...args: ClassValue[]): string => mergeClasses(join(args));

const join = (args: ClassValue[]): string => {
    return args.reduce((acc: string, arg) => {
        if (arg === undefined || arg === null || arg === false) return acc;
        if (typeof arg === 'string' || typeof arg === 'number') return acc + ' ' + arg;
        if (Array.isArray(arg)) return acc + ' ' + join(arg);
        if (typeof arg === 'object') {
            return (
                acc +
                ' ' +
                Object.entries(arg).reduce((acc, [key, value]) => {
                    if (value === undefined || value === null || value === false) return acc;
                    if (typeof value === 'string' || typeof value === 'number') return acc + ' ' + key + '-' + value;
                    if (typeof value === 'boolean') return value ? acc + ' ' + key : acc;
                    return acc;
                }, '')
            );
        }
        return acc;
    }, '');
};
export type ClassValue = ClassArray | ClassDictionary | string | number | null | boolean | undefined;
export type ClassDictionary = Record<string, unknown>;
export type ClassArray = ClassValue[];
