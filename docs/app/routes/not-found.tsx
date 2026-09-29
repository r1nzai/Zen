import { NotFound } from '../components/not-found';

/*
 * Any URL no other route matches. Prerendered once (/404) and copied to
 * 404.html by the build, which Cloudflare serves with a 404 status for every
 * unknown URL: a complete page before scripts run, and it hydrates on any URL
 * because every unknown URL matches this same route.
 */
export const meta = () => [{ title: 'Not found · Zen' }, { name: 'robots', content: 'noindex' }];

export default function NotFoundPage() {
    return <NotFound />;
}
