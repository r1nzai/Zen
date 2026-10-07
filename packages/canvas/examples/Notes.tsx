import { Button, Canvas, CanvasItem, type CanvasItemRect, TextArea } from '@rinzai/zen';
import { useRef, useState } from 'react';

interface Note extends CanvasItemRect {
    text: string;
    color: string;
}

const COLORS = ['var(--chart-4)', 'var(--chart-3)', 'var(--chart-5)', 'var(--chart-1)'];

/**
 * Sticky notes with a field in each: typing, selecting text and the × button work as usual, because
 * presses on fields and buttons inside an item go to them. Drag a note by its edge or top strip.
 */
export default function Notes() {
    const [notes, setNotes] = useState<Note[]>([
        { id: 'n1', x: 24, y: 24, w: 170, h: 150, color: COLORS[0], text: 'Rent goes out on the 1st' },
        { id: 'n2', x: 220, y: 60, w: 170, h: 150, color: COLORS[1], text: 'Move $400 to the holiday fund' },
        { id: 'n3', x: 420, y: 30, w: 170, h: 150, color: COLORS[2], text: 'Cancel the old phone plan' },
    ]);
    const [selected, setSelected] = useState<string[]>([]);
    const count = useRef(notes.length);
    const edit = (id: string, patch: Partial<Note>) =>
        setNotes((all) => all.map((n) => (n.id === id ? { ...n, ...patch } : n)));

    return (
        <div className="flex w-full max-w-3xl flex-col gap-3">
            <Canvas
                aria-label="Notes"
                width={620}
                height={260}
                scale="fit"
                minSize={120}
                items={notes}
                onChange={setNotes}
                selected={selected}
                onSelect={setSelected}
            >
                {notes.map((note, i) => (
                    <CanvasItem
                        key={note.id}
                        id={note.id}
                        label={`Note ${i + 1}`}
                        style={{ background: `color-mix(in oklch, ${note.color} 22%, oklch(var(--card)))` }}
                        className="flex flex-col overflow-hidden rounded-xl shadow-[0_10px_30px_-12px_oklch(0_0_0/0.6)]"
                    >
                        <div className="flex h-7 shrink-0 items-center justify-between pr-1 pl-3">
                            <span aria-hidden className="h-1 w-8 rounded-full" style={{ background: note.color }} />
                            <button
                                type="button"
                                aria-label={`Remove note ${i + 1}`}
                                onClick={() => setNotes((all) => all.filter((n) => n.id !== note.id))}
                                className="text-muted-foreground hover:text-foreground grid size-6 cursor-pointer place-items-center rounded-md"
                            >
                                ×
                            </button>
                        </div>
                        <TextArea
                            aria-label={`Note ${i + 1}`}
                            value={note.text}
                            onChange={(e) => edit(note.id, { text: e.target.value })}
                            className="min-h-0 flex-1 resize-none rounded-none border-0 bg-transparent px-3 pt-0 shadow-none"
                        />
                    </CanvasItem>
                ))}
            </Canvas>
            <div>
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                        const id = `n${++count.current}`;
                        setNotes((all) => [
                            ...all,
                            {
                                id,
                                x: 225,
                                y: 55,
                                w: 170,
                                h: 150,
                                color: COLORS[count.current % COLORS.length],
                                text: '',
                            },
                        ]);
                        setSelected([id]);
                    }}
                >
                    Add a note
                </Button>
            </div>
        </div>
    );
}
