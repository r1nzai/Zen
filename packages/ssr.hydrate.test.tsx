import { act } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';

import { Badge, Button, Collapse, Dropdown, Input, Popover, TextArea, Toggle } from '.';

// Tell React this environment supports act(); jsdom lacks ResizeObserver (used by Collapse).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

const items = [
    { key: '1', text: 'One' },
    { key: '2', text: 'Two' },
];

const components = {
    Badge: <Badge>badge</Badge>,
    Button: <Button>button</Button>,
    Collapse: <Collapse items={['a', 'b']}>{(item) => <span key={item}>{item}</span>}</Collapse>,
    'Dropdown (single)': <Dropdown items={items} selected={items[0]} onChange={() => {}} />,
    'Dropdown (multiple)': <Dropdown multiple items={items} selected={items} onChange={() => {}} />,
    Input: <Input />,
    Popover: <Popover content={<span>content</span>}>trigger</Popover>,
    TextArea: <TextArea />,
    Toggle: <Toggle />,
};

describe('hydration', () => {
    it.each(Object.entries(components))('%s hydrates without mismatches', async (_, element) => {
        const container = document.createElement('div');
        container.innerHTML = renderToString(element);
        document.body.appendChild(container);

        const onRecoverableError = vi.fn();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        const root = await act(async () => hydrateRoot(container, element, { onRecoverableError }));

        expect(onRecoverableError).not.toHaveBeenCalled();
        expect(consoleError).not.toHaveBeenCalled();

        act(() => root.unmount());
        container.remove();
        consoleError.mockRestore();
    });
});
