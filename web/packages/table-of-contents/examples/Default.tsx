import { TableOfContents } from '@rinzai/zen';

/** Point items at heading ids; the link for the section being read lights up as you scroll. */
export default function Default() {
    return (
        <TableOfContents
            className="w-48"
            items={[
                { id: 'installation', label: 'Installation' },
                { id: 'usage', label: 'Usage' },
                { id: 'theming', label: 'Theming' },
                { id: 'tokens', label: 'Tokens', depth: 2 },
            ]}
        />
    );
}
