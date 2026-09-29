import { Backdrop, ThemeScript, ToastProvider } from '@rinzai/zen';
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import topo from '../../packages/backdrop/examples/topo.svg';
import type { Route } from './+types/root';
import { SiteHeader } from './components/site-header';
import './app.css';

export const links: Route.LinksFunction = () => [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap' },
    // SVG for browsers that take it, ICO for everything that asks for /favicon.ico, and iOS's own.
    { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="theme-color" content="#0d0b12" />
                {/* Before first paint: the remembered theme, so light-mode visitors never see a dark flash. */}
                <ThemeScript />
                <Meta />
                <Links />
            </head>
            <body>
                <ToastProvider>
                    <Backdrop topoSrc={topo} />
                    <SiteHeader />
                    {children}
                </ToastProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const notFound = isRouteErrorResponse(error) && error.status === 404;
    return (
        <main className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-32 text-center">
            {/* Error and not-found pages stay out of search results (React hoists these into <head>). */}
            <title>{notFound ? 'Not found · Zen' : 'Error · Zen'}</title>
            <meta name="robots" content="noindex" />
            <h1 className="text-aurora text-5xl">{notFound ? '404' : 'Something broke'}</h1>
            <p className="text-muted-foreground mt-0!">
                {notFound ? "There's no page here." : error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <a href="/" className="text-primary underline-offset-4 hover:underline">
                Back to the docs
            </a>
        </main>
    );
}
