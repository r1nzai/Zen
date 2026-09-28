// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { useHydrated } from './useHydrated';

it('is false while rendering on the server', () => {
    function Probe() {
        return createElement('span', null, String(useHydrated()));
    }
    expect(renderToString(createElement(Probe))).toBe('<span>false</span>');
});
