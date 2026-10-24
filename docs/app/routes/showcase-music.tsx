import MusicApp from '../../../packages/showcase/examples/MusicApp';
import { ShowcaseNav } from '../components/showcase-nav';
import { seo } from '../seo';

export const meta = () =>
    seo({
        title: 'Showcase: a music app built with Zen',
        description:
            'A working music player built only from Zen components: a player bar with seek and volume, shuffle and repeat, a queue, mixes in a carousel, and lock-screen controls through the Media Session API.',
        path: '/showcase/music/',
    });

export default function ShowcaseMusic() {
    return (
        <>
            <ShowcaseNav />
            <MusicApp nav={false} />
        </>
    );
}
