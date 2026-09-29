import {
    Button,
    Dialog,
    DialogClose,
    DialogFooter,
    Combobox,
    ComboboxEmpty,
    ComboboxList,
    ComboboxPopup,
    ComboboxSearch,
    ComboboxTrigger,
    MonthPicker,
    Select,
    useToast,
} from '@rinzai/zen';
import { useState } from 'react';

const CATEGORIES = [
    { value: 'groceries', label: 'Groceries' },
    { value: 'rent', label: 'Rent' },
    { value: 'transport', label: 'Transport' },
    { value: 'dining', label: 'Dining out' },
] as const;
const TAGS = ['Essential', 'Shared', 'Work', 'Treat'];
const asText = (tag: string) => tag;

/** Selects, pickers and menus open above the dialog, and toasts show over it (try Save draft). */
export default function Pickers() {
    const toast = useToast();
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState<(typeof CATEGORIES)[number]['value'] | null>('groceries');
    const [month, setMonth] = useState<string | null>('2026-09');
    const [tags, setTags] = useState<string[]>([TAGS[0]]);
    return (
        <>
            <Button onClick={() => setOpen(true)}>Add budget</Button>
            <Dialog open={open} onOpenChange={setOpen} title="Add budget">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm">
                        Category
                        <Select aria-label="Category" value={category} options={CATEGORIES} onChange={setCategory} />
                    </label>
                    <label className="flex flex-col gap-2 text-sm">
                        From
                        <MonthPicker aria-label="From" value={month} onChange={setMonth} locale="en-IN" />
                    </label>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                    <span>Tags</span>
                    <Combobox
                        multiple
                        items={TAGS}
                        itemKey={asText}
                        itemText={asText}
                        value={tags}
                        onValueChange={setTags}
                    >
                        <ComboboxTrigger className="w-full" />
                        <ComboboxPopup>
                            <ComboboxSearch />
                            <ComboboxList>
                                <ComboboxEmpty />
                            </ComboboxList>
                        </ComboboxPopup>
                    </Combobox>
                </div>
                <DialogFooter>
                    <Button variant="ghost" className="mr-auto" onClick={() => toast('Draft saved', { tone: 'info' })}>
                        Save draft
                    </Button>
                    <DialogClose variant="outline">Cancel</DialogClose>
                    <DialogClose onClick={() => toast('Budget added', { tone: 'success' })}>Add</DialogClose>
                </DialogFooter>
            </Dialog>
        </>
    );
}
