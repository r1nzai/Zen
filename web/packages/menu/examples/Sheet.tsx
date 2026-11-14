import {
    buttonVariants,
    Menu,
    MenuContent,
    MenuItem,
    MenuSeparator,
    MenuSub,
    MenuSubContent,
    MenuSubTrigger,
    MenuTrigger,
    useToast,
} from '@rinzai/zen';
import Ellipsis from '@zen/icons/ellipsis';
import Heart from '@zen/icons/heart';
import MusicalNote from '@zen/icons/musical-note';
import QueueList from '@zen/icons/queue-list';

/** A song's menu: on a phone (narrow the window), a bottom sheet, its playlists sliding in over it. */
export default function Sheet() {
    const toast = useToast();
    return (
        <Menu>
            <MenuTrigger aria-label="Song actions" className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                <Ellipsis />
            </MenuTrigger>
            <MenuContent sheet>
                <MenuItem icon={<QueueList className="size-4" />} onSelect={() => toast('Playing next')}>
                    Play next
                </MenuItem>
                <MenuItem icon={<Heart className="size-4" />} onSelect={() => toast('Liked', { tone: 'positive' })}>
                    Like
                </MenuItem>
                <MenuSub>
                    <MenuSubTrigger icon={<MusicalNote className="size-4" />}>Add to playlist</MenuSubTrigger>
                    <MenuSubContent>
                        {['Late night', 'Focus', 'Running', 'Sunday morning'].map((name) => (
                            <MenuItem key={name} onSelect={() => toast(`Added to ${name}`, { tone: 'positive' })}>
                                {name}
                            </MenuItem>
                        ))}
                    </MenuSubContent>
                </MenuSub>
                <MenuSeparator />
                <MenuItem tone="negative" onSelect={() => toast('Removed from queue', { tone: 'negative' })}>
                    Remove from queue
                </MenuItem>
            </MenuContent>
        </Menu>
    );
}
