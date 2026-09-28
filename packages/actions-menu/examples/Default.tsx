import { ActionsMenu, useToast } from '@rinzai/zen';

export default function Default() {
    const toast = useToast();
    return (
        <ActionsMenu
            label="Goal actions"
            actions={[
                { label: 'Edit', onClick: () => toast('Edit') },
                { label: 'Duplicate', onClick: () => toast('Duplicated', { tone: 'success' }) },
                { label: 'Delete', onClick: () => toast('Deleted', { tone: 'error' }), destructive: true },
            ]}
        />
    );
}
