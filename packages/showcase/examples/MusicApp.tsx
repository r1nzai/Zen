import { useState, useSyncExternalStore } from 'react';

import {
    Avatar,
    Button,
    type ButtonProps,
    Carousel,
    CarouselContent,
    CarouselControls,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    cx,
    Dialog,
    EmptyState,
    formatDuration,
    Header,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    Marquee,
    type MediaPlayer,
    Menu,
    MenuContent,
    MenuItem,
    MenuSub,
    MenuSubContent,
    MenuSubTrigger,
    MenuTrigger,
    PlayerBar,
    Popover,
    PopoverContent,
    PopoverTrigger,
    SeekBar,
    Slider,
    SortableHandle,
    SortableItem,
    SortableList,
    TabBar,
    TabBarItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableHeader,
    TableRow,
    ThemeToggle,
    useMediaPlayer,
    useMediaSession,
    useToast,
} from '@rinzai/zen';
import ArrowPath from '@zen/icons/arrow-path';
import ArrowsRightLeft from '@zen/icons/arrows-right-left';
import Backward from '@zen/icons/backward';
import Ellipsis from '@zen/icons/ellipsis';
import Forward from '@zen/icons/forward';
import Heart from '@zen/icons/heart';
import HeartSolid from '@zen/icons/heart-solid';
import MusicalNote from '@zen/icons/musical-note';
import Pause from '@zen/icons/pause';
import Play from '@zen/icons/play';
import QueueList from '@zen/icons/queue-list';
import Search from '@zen/icons/search';
import SpeakerWave from '@zen/icons/speaker-wave';
import SpeakerXMark from '@zen/icons/speaker-x-mark';
import Squares from '@zen/icons/squares';

import { type DemoTrack, demoTrackSeconds, GLASS_AURORA, useDemoTrack } from '../../player-bar/examples/demo-track';

// ── Library ──

/** Cover art: two colours, drawn the same in the page and for the lock screen. */
type Colors = [from: string, to: string];

interface Album {
    id: string;
    title: string;
    artist: string;
    year: number;
    colors: Colors;
}

interface Track {
    id: string;
    title: string;
    album: Album;
    sound: DemoTrack;
}

const AURORA: Album = {
    id: 'aurora',
    title: 'Aurora',
    artist: 'Halcyon Drift',
    year: 2026,
    colors: ['#7c3aed', '#e879f9'],
};
const TRANSIT: Album = {
    id: 'transit',
    title: 'Night Transit',
    artist: 'Mira Vale',
    year: 2025,
    colors: ['#1e3a8a', '#38bdf8'],
};
const TIDE: Album = {
    id: 'tide',
    title: 'Low Tide',
    artist: 'The Quiet Hours',
    year: 2024,
    colors: ['#115e59', '#a7f3d0'],
};
const BLOOM: Album = { id: 'bloom', title: 'Slow Bloom', artist: 'Ostra', year: 2026, colors: ['#9f1239', '#fdba74'] };

const sound = (chords: number[][], chordSeconds: number, rounds: number): DemoTrack => ({
    chords,
    chordSeconds,
    rounds,
});

const TRACKS: Track[] = [
    { id: 'glass-aurora', title: 'Glass Aurora', album: AURORA, sound: GLASS_AURORA },
    {
        id: 'afterglow',
        title: 'Afterglow',
        album: AURORA,
        sound: sound(
            [
                [55, 59, 62],
                [52, 55, 59],
                [48, 52, 55],
                [50, 54, 57],
            ],
            2.4,
            3,
        ),
    },
    {
        id: 'night-transit',
        title: 'Night Transit',
        album: TRANSIT,
        sound: sound(
            [
                [62, 65, 69],
                [58, 62, 65],
                [53, 57, 60],
                [60, 64, 67],
            ],
            2,
            3,
        ),
    },
    {
        id: 'paper-moons',
        title: 'Paper Moons',
        album: TRANSIT,
        sound: sound(
            [
                [64, 67, 71],
                [60, 64, 67],
                [55, 59, 62],
                [62, 66, 69],
            ],
            2.2,
            3,
        ),
    },
    {
        id: 'low-tide',
        title: 'Low Tide',
        album: TIDE,
        sound: sound(
            [
                [60, 64, 67],
                [57, 60, 64],
                [53, 57, 60],
                [55, 59, 62],
            ],
            3,
            2,
        ),
    },
    {
        id: 'harbour-lights',
        title: 'Harbour Lights',
        album: TIDE,
        sound: sound(
            [
                [57, 61, 64],
                [54, 57, 61],
                [50, 54, 57],
                [52, 56, 59],
            ],
            2.6,
            3,
        ),
    },
    {
        id: 'slow-bloom',
        title: 'Slow Bloom',
        album: BLOOM,
        sound: sound(
            [
                [53, 57, 60],
                [50, 53, 57],
                [46, 50, 53],
                [48, 52, 55],
            ],
            3.2,
            2,
        ),
    },
    {
        id: 'first-light',
        title: 'First Light',
        album: BLOOM,
        sound: sound(
            [
                [59, 63, 66],
                [56, 59, 63],
                [52, 56, 59],
                [54, 58, 61],
            ],
            2.8,
            2,
        ),
    },
];

const byId = (id: string) => TRACKS.find((t) => t.id === id)!;

interface Mix {
    title: string;
    lead: string;
    colors: Colors;
    tracks: string[];
}

const MIXES: Mix[] = [
    {
        title: 'Evening calm',
        lead: 'Soft pads to wind down',
        colors: ['#4c1d95', '#f0abfc'],
        tracks: ['low-tide', 'slow-bloom', 'glass-aurora'],
    },
    {
        title: 'Night drive',
        lead: 'City lights, open road',
        colors: ['#0f172a', '#6366f1'],
        tracks: ['night-transit', 'paper-moons', 'afterglow'],
    },
    {
        title: 'Deep focus',
        lead: 'Nothing to pull you away',
        colors: ['#134e4a', '#5eead4'],
        tracks: ['harbour-lights', 'low-tide', 'first-light'],
    },
    {
        title: 'Morning light',
        lead: 'A gentle start',
        colors: ['#9a3412', '#fde68a'],
        tracks: ['first-light', 'glass-aurora', 'slow-bloom'],
    },
    {
        title: 'Slow Sunday',
        lead: 'No plans, no hurry',
        colors: ['#701a75', '#fda4af'],
        tracks: ['slow-bloom', 'harbour-lights', 'afterglow'],
    },
    {
        title: 'Afterhours',
        lead: 'Late, low and warm',
        colors: ['#1e1b4b', '#c084fc'],
        tracks: ['afterglow', 'night-transit', 'paper-moons'],
    },
];

const gradient = ([from, to]: Colors) =>
    `radial-gradient(circle at 28% 22%, rgb(255 255 255 / 0.28), transparent 55%), linear-gradient(135deg, ${from}, ${to})`;

function Cover({ colors, className }: { colors: Colors; className?: string }) {
    return (
        <div aria-hidden className={cx('shrink-0 rounded-lg', className)} style={{ background: gradient(colors) }} />
    );
}

/** The same cover as a 512px PNG, for the lock screen and the OS media controls. */
const art = new Map<string, string>();
function coverUrl(colors: Colors) {
    const key = colors.join();
    let url = art.get(key);
    if (!url) {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const g = canvas.getContext('2d')!;
        const linear = g.createLinearGradient(0, 0, 512, 512);
        linear.addColorStop(0, colors[0]);
        linear.addColorStop(1, colors[1]);
        g.fillStyle = linear;
        g.fillRect(0, 0, 512, 512);
        const light = g.createRadialGradient(143, 113, 0, 143, 113, 400);
        light.addColorStop(0, 'rgb(255 255 255 / 0.28)');
        light.addColorStop(0.55, 'rgb(255 255 255 / 0)');
        g.fillStyle = light;
        g.fillRect(0, 0, 512, 512);
        url = canvas.toDataURL('image/png');
        art.set(key, url);
    }
    return url;
}
const subscribe = () => () => {};
const useCoverUrl = (colors: Colors) =>
    useSyncExternalStore(
        subscribe,
        () => coverUrl(colors),
        () => undefined,
    );

// ── Playback ──

type Repeat = 'off' | 'all' | 'one';

function shuffled<T>(items: T[]) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}

/** What's playing, and what's next: a list of tracks, in order or shuffled. */
function useQueue() {
    const [source, setSource] = useState(TRACKS.map((t) => t.id));
    const [queue, setQueue] = useState(source);
    const [at, setAt] = useState(0);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState<Repeat>('off');
    // Off until the first tap: then each new track plays as it loads.
    const [started, setStarted] = useState(false);

    const playList = (ids: string[], start = ids[0]) => {
        const order = shuffle ? [start, ...shuffled(ids.filter((id) => id !== start))] : ids;
        setSource(ids);
        setQueue(order);
        setAt(order.indexOf(start));
        setStarted(true);
    };
    const go = (to: number) => {
        setAt((to + queue.length) % queue.length);
        setStarted(true);
    };
    const toggleShuffle = () => {
        const current = queue[at];
        const order = shuffle ? source : [current, ...shuffled(source.filter((id) => id !== current))];
        setShuffle(!shuffle);
        setQueue(order);
        setAt(order.indexOf(current));
    };

    return {
        track: byId(queue[at]),
        upNext: queue.slice(at + 1).map(byId),
        started,
        shuffle,
        repeat,
        hasNext: at < queue.length - 1 || repeat === 'all',
        playList,
        /** Puts the tracks after this one in a new order. */
        reorder: (upNext: string[]) => setQueue([...queue.slice(0, at + 1), ...upNext]),
        /** Moves a track (from wherever it is in the queue) to play after this one. */
        playNext: (id: string) => {
            if (id === queue[at]) return;
            const rest = queue.filter((q) => q !== id);
            const now = rest.indexOf(queue[at]);
            setQueue([...rest.slice(0, now + 1), id, ...rest.slice(now + 1)]);
            setAt(now);
        },
        next: () => go(at + 1),
        previous: () => go(at - 1),
        toggleShuffle,
        cycleRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
        /** At the end of a track: on to the next, round again with repeat all, or stop. */
        ended: () => (at < queue.length - 1 || repeat === 'all' ? go(at + 1) : setStarted(false)),
    };
}

type Queue = ReturnType<typeof useQueue>;

const TABS = [
    { label: 'Home', icon: <Squares /> },
    { label: 'Search', icon: <Search /> },
    { label: 'Library', icon: <MusicalNote /> },
];

/** `nav={false}` drops the app's own top bar and tab bar, for pages that already have one. */
export default function MusicApp({ nav = true }: { nav?: boolean }) {
    const queue = useQueue();
    const { track } = queue;
    const src = useDemoTrack(track.sound);
    const [audioRef, player] = useMediaPlayer();
    const [liked, setLiked] = useState<ReadonlySet<string>>(new Set(['glass-aurora', 'low-tide']));
    const [nowPlaying, setNowPlaying] = useState(false);
    const like = (id: string) =>
        setLiked((l) => {
            const next = new Set(l);
            if (!next.delete(id)) next.add(id);
            return next;
        });

    // Back to the start of the track, or to the one before when near it.
    const previous = () => (player.currentTime > 3 ? player.seek(0) : queue.previous());
    const cover = useCoverUrl(track.album.colors);
    useMediaSession(player, {
        title: track.title,
        artist: track.album.artist,
        album: track.album.title,
        artwork: cover ? [{ src: cover, sizes: '512x512', type: 'image/png' }] : undefined,
        onPrevious: previous,
        onNext: queue.hasNext ? queue.next : undefined,
    });

    const play = (ids: string[], start?: string) =>
        start === track.id && queue.started ? player.toggle() : queue.playList(ids, start);

    const controls: Controls = { player, queue, previous, src };

    return (
        <div>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                autoPlay={queue.started}
                loop={queue.repeat === 'one'}
                onEnded={queue.ended}
            />
            {nav && (
                <Header>
                    <span className="text-lg font-semibold tracking-tight">Zen Music</span>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Avatar name="Rin" className="size-8 text-xs" />
                    </div>
                </Header>
            )}
            <div className="rise mx-auto flex max-w-6xl flex-col gap-10 p-6 pb-[calc(var(--zen-tab-bar-height,0px)+var(--zen-player-bar-height,0px)+2.5rem)] md:p-10 md:pb-[calc(var(--zen-player-bar-height,0px)+2.5rem)]">
                <Featured
                    album={AURORA}
                    playing={player.playing && track.album === AURORA}
                    onPlay={(ids) => (queue.started && track.album === AURORA ? player.toggle() : play(ids))}
                />
                <Mixes onPlay={(mix) => play(mix.tracks)} />
                <Tracks
                    current={track}
                    playing={player.playing}
                    liked={liked}
                    onLike={like}
                    onPlay={(id, ids) => play(ids, id)}
                    onPlayNext={queue.playNext}
                />
            </div>

            <PlayerBar aria-label="Now playing" className="md:gap-6">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <button
                        type="button"
                        className="focus-ring flex min-w-0 items-center gap-3 rounded-lg text-start"
                        aria-label={`${track.title}, ${track.album.artist}. Open now playing`}
                        onClick={() => setNowPlaying(true)}
                    >
                        <Cover colors={track.album.colors} className="size-10 md:size-12" />
                        <span className="min-w-0">
                            <Marquee trigger="always" className="text-sm font-medium">
                                {track.title}
                            </Marquee>
                            <Marquee trigger="always" className="text-muted-foreground text-xs">
                                {track.album.artist}
                            </Marquee>
                        </span>
                    </button>
                    <LikeButton className="max-md:hidden" liked={liked.has(track.id)} onClick={() => like(track.id)} />
                </div>
                <div className="flex items-center gap-1 md:hidden">
                    <PlayButton player={player} queue={queue} src={src} variant="ghost" size="icon" />
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next"
                        disabled={!queue.hasNext}
                        onClick={queue.next}
                    >
                        <Forward className="size-5" />
                    </Button>
                </div>
                <div className="flex flex-[2] flex-col items-center gap-1 max-md:hidden">
                    <Transport {...controls} />
                    <SeekBar
                        className="w-full max-w-xl"
                        currentTime={player.currentTime}
                        playing={player.playing && !player.waiting}
                        playbackRate={player.playbackRate}
                        duration={player.duration}
                        buffered={player.buffered}
                        onSeek={player.seek}
                    />
                </div>
                <div className="flex flex-1 items-center justify-end gap-1 max-md:hidden">
                    <UpNext queue={queue} />
                    <Volume player={player} />
                </div>
                <span
                    aria-hidden
                    className="bg-primary absolute start-0 bottom-0 h-0.5 shadow-[0_0_8px_oklch(var(--glow)/calc(0.8*var(--glow-k)))] md:hidden"
                    style={{ width: `${player.duration ? (player.currentTime / player.duration) * 100 : 0}%` }}
                />
            </PlayerBar>

            {nav && (
                <TabBar aria-label="Main">
                    {TABS.map(({ label, icon }, i) => (
                        <TabBarItem
                            key={label}
                            href={`#${label.toLowerCase()}`}
                            icon={icon}
                            active={i === 0}
                            onClick={(e) => e.preventDefault()}
                        >
                            {label}
                        </TabBarItem>
                    ))}
                </TabBar>
            )}

            <Dialog open={nowPlaying} onOpenChange={setNowPlaying} side="bottom" title="Now playing">
                <div className="flex flex-col items-center gap-5 pb-2">
                    <Cover
                        colors={track.album.colors}
                        className="aspect-square w-full max-w-72 rounded-2xl shadow-[0_24px_64px_-16px_oklch(var(--glow)/calc(0.6*var(--glow-k)))]"
                    />
                    <div className="flex w-full items-center gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-semibold">{track.title}</p>
                            <p className="text-muted-foreground mt-0! truncate text-sm">
                                {track.album.artist} · {track.album.title}
                            </p>
                        </div>
                        <LikeButton liked={liked.has(track.id)} onClick={() => like(track.id)} />
                    </div>
                    <SeekBar
                        className="w-full"
                        times="below"
                        currentTime={player.currentTime}
                        playing={player.playing && !player.waiting}
                        playbackRate={player.playbackRate}
                        duration={player.duration}
                        buffered={player.buffered}
                        onSeek={player.seek}
                    />
                    <Transport {...controls} large />
                </div>
            </Dialog>
        </div>
    );
}

// ── Library views ──

function Featured({ album, playing, onPlay }: { album: Album; playing: boolean; onPlay: (ids: string[]) => void }) {
    const tracks = TRACKS.filter((t) => t.album === album);
    const length = tracks.reduce((sum, t) => sum + demoTrackSeconds(t.sound), 0);
    return (
        <section aria-labelledby="featured" className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <Cover
                colors={album.colors}
                className="aspect-square w-full max-w-56 rounded-2xl shadow-[0_24px_64px_-16px_oklch(var(--glow)/calc(0.7*var(--glow-k)))] max-sm:mx-auto"
            />
            <div className="flex flex-col gap-3">
                <p className="text-muted-foreground mt-0! text-sm">New album · {album.year}</p>
                <h1 id="featured" className="text-aurora text-4xl font-semibold tracking-tight lg:text-5xl">
                    {album.title}
                </h1>
                <p className="text-muted-foreground mt-0!">
                    {album.artist} · {tracks.length} tracks, {formatDuration(length)}
                </p>
                <div className="flex gap-2">
                    <Button className="rounded-full" onClick={() => onPlay(tracks.map((t) => t.id))}>
                        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
                        {playing ? 'Pause' : 'Play'}
                    </Button>
                </div>
            </div>
        </section>
    );
}

function Mixes({ onPlay }: { onPlay: (mix: Mix) => void }) {
    return (
        <section aria-labelledby="mixes" className="flex flex-col gap-3">
            <Carousel aria-labelledby="mixes">
                <div className="flex items-center justify-between gap-3">
                    <h2 id="mixes" className="text-xl font-semibold">
                        Made for you
                    </h2>
                    <CarouselControls className="mt-0">
                        <CarouselPrevious />
                        <CarouselNext />
                    </CarouselControls>
                </div>
                <CarouselContent className="mt-3 gap-4">
                    {MIXES.map((mix) => (
                        <CarouselItem
                            key={mix.title}
                            className="basis-[calc(50%-0.5rem)] sm:basis-[calc(33.333%-0.667rem)] lg:basis-[calc(22%-0.75rem)]"
                        >
                            <button
                                type="button"
                                data-zen-marquee-host
                                className="group focus-ring flex w-full flex-col gap-2 rounded-xl text-start"
                                onClick={() => onPlay(mix)}
                            >
                                <span className="relative block">
                                    <Cover colors={mix.colors} className="aspect-square w-full rounded-xl" />
                                    <span className="bg-primary text-primary-foreground absolute end-3 bottom-3 grid size-10 translate-y-1 place-items-center rounded-full opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                                        <Play className="size-5" />
                                    </span>
                                </span>
                                <span className="min-w-0">
                                    <Marquee className="text-sm font-medium">{mix.title}</Marquee>
                                    <Marquee className="text-muted-foreground text-xs">{mix.lead}</Marquee>
                                </span>
                            </button>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </section>
    );
}

function Tracks({
    current,
    playing,
    liked,
    onLike,
    onPlay,
    onPlayNext,
}: {
    current: Track;
    playing: boolean;
    liked: ReadonlySet<string>;
    onLike: (id: string) => void;
    onPlay: (id: string, ids: string[]) => void;
    onPlayNext: (id: string) => void;
}) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const found = TRACKS.filter((t) =>
        [t.title, t.album.title, t.album.artist].some((s) => s.toLowerCase().includes(q)),
    );
    const ids = found.map((t) => t.id);
    return (
        <section aria-labelledby="tracks" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="tracks" className="text-xl font-semibold">
                    All tracks
                </h2>
                <InputGroup className="w-64 max-sm:w-full">
                    <InputGroupAddon>
                        <Search className="size-4" />
                    </InputGroupAddon>
                    <InputGroupInput
                        type="search"
                        aria-label="Search tracks"
                        placeholder="Search tracks, albums, artists"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </InputGroup>
            </div>
            {found.length === 0 ? (
                <EmptyState title="No tracks found" description={`Nothing matches “${query.trim()}”.`} />
            ) : (
                <TableContainer>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 max-sm:hidden">#</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead className="max-sm:hidden">Album</TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">Liked</span>
                                </TableHead>
                                <TableHead numeric className="w-20 max-sm:hidden">
                                    Length
                                </TableHead>
                                <TableHead className="w-12">
                                    <span className="sr-only">More</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="rise-list">
                            {found.map((t, i) => {
                                const isCurrent = t === current;
                                return (
                                    <TableRow key={t.id} aria-current={isCurrent || undefined}>
                                        <TableCell className="text-muted-foreground tabular-nums max-sm:hidden">
                                            {isCurrent ? <MusicalNote className="text-primary size-4" /> : i + 1}
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                type="button"
                                                data-zen-marquee-host
                                                className="focus-ring flex min-w-0 items-center gap-3 rounded-md text-start"
                                                aria-label={`${isCurrent && playing ? 'Pause' : 'Play'} ${t.title}`}
                                                onClick={() => onPlay(t.id, ids)}
                                            >
                                                <Cover colors={t.album.colors} className="size-10 rounded-md" />
                                                <span className="min-w-0">
                                                    <Marquee className={cx('font-medium', isCurrent && 'text-primary')}>
                                                        {t.title}
                                                    </Marquee>
                                                    <Marquee className="text-muted-foreground text-xs">
                                                        {t.album.artist}
                                                    </Marquee>
                                                </span>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-sm:hidden">
                                            {t.album.title}
                                        </TableCell>
                                        <TableCell>
                                            <LikeButton
                                                liked={liked.has(t.id)}
                                                label={t.title}
                                                onClick={() => onLike(t.id)}
                                            />
                                        </TableCell>
                                        <TableCell numeric className="text-muted-foreground max-sm:hidden">
                                            {formatDuration(demoTrackSeconds(t.sound))}
                                        </TableCell>
                                        <TableCell>
                                            <TrackMenu
                                                track={t}
                                                liked={liked.has(t.id)}
                                                onLike={() => onLike(t.id)}
                                                onPlayNext={() => onPlayNext(t.id)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </section>
    );
}

/** A track's menu: a bottom sheet on phones, as music apps show one, its mixes sliding in over it. */
function TrackMenu({
    track,
    liked,
    onLike,
    onPlayNext,
}: {
    track: Track;
    liked: boolean;
    onLike: () => void;
    onPlayNext: () => void;
}) {
    const toast = useToast();
    return (
        <Menu>
            <MenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`More for ${track.title}`}>
                    <Ellipsis className="size-4" />
                </Button>
            </MenuTrigger>
            <MenuContent sheet>
                <MenuItem
                    icon={<QueueList className="size-4" />}
                    onSelect={() => {
                        onPlayNext();
                        toast(`${track.title} plays next`);
                    }}
                >
                    Play next
                </MenuItem>
                <MenuItem
                    icon={liked ? <HeartSolid className="size-4" /> : <Heart className="size-4" />}
                    onSelect={onLike}
                >
                    {liked ? 'Remove from liked' : 'Like'}
                </MenuItem>
                <MenuSub>
                    <MenuSubTrigger icon={<MusicalNote className="size-4" />}>Add to mix</MenuSubTrigger>
                    <MenuSubContent>
                        {MIXES.map((mix) => (
                            <MenuItem
                                key={mix.title}
                                onSelect={() => toast(`Added to ${mix.title}`, { tone: 'positive' })}
                            >
                                {mix.title}
                            </MenuItem>
                        ))}
                    </MenuSubContent>
                </MenuSub>
            </MenuContent>
        </Menu>
    );
}

// ── Controls ──

interface Controls {
    player: MediaPlayer;
    queue: Queue;
    previous: () => void;
    src: string | undefined;
}

function PlayButton({ player, queue, src, ...rest }: Omit<Controls, 'previous'> & ButtonProps) {
    return (
        <Button
            aria-label={player.playing ? 'Pause' : 'Play'}
            disabled={!src}
            onClick={() =>
                queue.started
                    ? player.toggle()
                    : queue.playList(
                          TRACKS.map((t) => t.id),
                          queue.track.id,
                      )
            }
            {...rest}
        >
            {player.playing ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
    );
}

/** Shuffle, previous, play, next and repeat. */
function Transport({ large, ...controls }: Controls & { large?: boolean }) {
    const { queue, previous } = controls;
    const small = large ? 'icon' : 'icon-sm';
    const icon = large ? 'size-6' : 'size-4';
    return (
        <div className={cx('flex items-center', large ? 'gap-4' : 'gap-2')}>
            <Button
                variant="ghost"
                size={small}
                aria-label="Shuffle"
                aria-pressed={queue.shuffle}
                className={cx(queue.shuffle && 'text-primary')}
                onClick={queue.toggleShuffle}
            >
                <ArrowsRightLeft className={icon} />
            </Button>
            <Button variant="ghost" size={small} aria-label="Previous" onClick={previous}>
                <Backward className={icon} />
            </Button>
            <PlayButton
                player={controls.player}
                queue={queue}
                src={controls.src}
                size={large ? 'icon-lg' : 'icon'}
                className={cx('rounded-full', large && 'size-16 [&_svg]:size-7')}
            />
            <Button variant="ghost" size={small} aria-label="Next" disabled={!queue.hasNext} onClick={queue.next}>
                <Forward className={icon} />
            </Button>
            <Button
                variant="ghost"
                size={small}
                aria-label={queue.repeat === 'one' ? 'Repeat one' : 'Repeat'}
                aria-pressed={queue.repeat !== 'off'}
                className={cx('relative', queue.repeat !== 'off' && 'text-primary')}
                onClick={queue.cycleRepeat}
            >
                <ArrowPath className={icon} />
                {queue.repeat === 'one' && (
                    <span aria-hidden className="absolute end-0.5 top-0.5 text-[0.6rem] font-bold">
                        1
                    </span>
                )}
            </Button>
        </div>
    );
}

function LikeButton({
    liked,
    label,
    className,
    onClick,
}: {
    liked: boolean;
    label?: string;
    className?: string;
    onClick: () => void;
}) {
    return (
        <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label ? `Like ${label}` : 'Like'}
            aria-pressed={liked}
            className={cx(liked && 'text-primary', className)}
            onClick={onClick}
        >
            {liked ? <HeartSolid className="size-4" /> : <Heart className="size-4" />}
        </Button>
    );
}

function UpNext({ queue }: { queue: Queue }) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Up next">
                    <QueueList className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent aria-label="Up next" className="w-72">
                <div className="flex flex-col gap-1 p-2">
                    <p className="text-muted-foreground px-2 py-1 text-xs font-medium">Up next</p>
                    {queue.upNext.length === 0 ? (
                        <p className="text-muted-foreground mt-0! px-2 py-3 text-sm">
                            {queue.repeat === 'all' ? 'The list starts again.' : 'Nothing after this one.'}
                        </p>
                    ) : (
                        <SortableList
                            aria-label="Up next"
                            value={queue.upNext.map((t) => t.id)}
                            onValueChange={queue.reorder}
                        >
                            {queue.upNext.map((t) => (
                                <QueueRow key={t.id} track={t} />
                            ))}
                        </SortableList>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function QueueRow({ track }: { track: Track }) {
    return (
        <SortableItem id={track.id} className="flex items-center gap-2 rounded-lg py-1.5 ps-0.5 pe-2">
            <SortableHandle id={track.id} label={track.title} />
            <Cover colors={track.album.colors} className="size-9 rounded-md" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{track.title}</p>
                <p className="text-muted-foreground mt-0! truncate text-xs">{track.album.artist}</p>
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
                {formatDuration(demoTrackSeconds(track.sound))}
            </span>
        </SortableItem>
    );
}

function Volume({ player }: { player: MediaPlayer }) {
    return (
        <>
            <Button
                variant="ghost"
                size="icon-sm"
                aria-label={player.muted ? 'Unmute' : 'Mute'}
                onClick={() => player.setMuted(!player.muted)}
            >
                {player.muted ? <SpeakerXMark className="size-4" /> : <SpeakerWave className="size-4" />}
            </Button>
            <Slider
                aria-label="Volume"
                className="w-24"
                value={player.muted ? 0 : Math.round(player.volume * 100)}
                onValueChange={(v) => {
                    player.setVolume(v / 100);
                    if (v > 0 && player.muted) player.setMuted(false);
                }}
            />
        </>
    );
}
