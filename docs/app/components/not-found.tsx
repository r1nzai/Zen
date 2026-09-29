import { buttonVariants } from '@rinzai/zen';
import { Link } from 'react-router';

/** The not-found page (the catch-all route, and a 404 thrown anywhere else). */
export function NotFound() {
    return (
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-32 text-center">
            <h1 className="text-aurora text-6xl">404</h1>
            <p className="text-muted-foreground mt-0! text-lg">There's no page here.</p>
            <div className="flex flex-wrap justify-center gap-3">
                <Link to="/" className={buttonVariants()}>
                    Back to the docs
                </Link>
                <Link to="/showcase/" className={buttonVariants({ variant: 'outline' })}>
                    See the showcase
                </Link>
            </div>
        </main>
    );
}
