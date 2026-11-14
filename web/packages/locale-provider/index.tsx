import { ENGLISH, type Messages } from '@zen/utils/messages';
import { createContext, ReactNode, useContext, useMemo } from 'react';

interface LocaleContextValue {
    locale: string;
    messages: Messages;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en-US', messages: ENGLISH });

/**
 * The language for everything inside: `locale` formats dates, numbers and
 * money and picks month and weekday names and the week's first day (a
 * component's own `locale` prop still wins), and `messages` replaces any of the
 * words components show or announce (see ENGLISH for them all; the rest stay
 * English). Without it, components use "en-US" and English. Nest one to change
 * part of the page.
 */
export default function LocaleProvider({ locale, messages, children }: LocaleProviderProps) {
    const outer = useContext(LocaleContext);
    const value = useMemo(
        () => ({
            locale: locale ?? outer.locale,
            messages: messages ? { ...outer.messages, ...messages } : outer.messages,
        }),
        [locale, messages, outer],
    );
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** The locale from the nearest LocaleProvider ("en-US" without one), or `own` when given. */
export function useLocale(own?: string): string {
    const { locale } = useContext(LocaleContext);
    return own ?? locale;
}

/** The words components use, from the nearest LocaleProvider (English without one). */
export function useMessages(): Messages {
    return useContext(LocaleContext).messages;
}

export interface LocaleProviderProps {
    /** e.g. "en-IN", "fr-FR". Defaults to the enclosing provider's, or "en-US". */
    locale?: string;
    /** Any of the words to replace; the others are kept. */
    messages?: Partial<Messages>;
    children: ReactNode;
}
