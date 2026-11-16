import { describe, expect, it } from 'vitest';

import type { NormalisedSeriesTooltipOptions } from 'ag-charts-core';

import { formatSeriesTooltip } from './seriesTooltip';

const content = { heading: 'h', title: 'base', data: [{ label: 'l', value: 'v' }] };

function format(renderer: (params: object) => unknown, base: object = content) {
    const tooltip = { enabled: true, renderer } as unknown as NormalisedSeriesTooltipOptions<object>;
    return formatSeriesTooltip(tooltip, [], base, {}) as Record<string, unknown>;
}

describe('formatSeriesTooltip', () => {
    it('keeps raw HTML for string renderer results', () => {
        expect(format(() => '<b>x</b>')).toEqual({ type: 'raw', rawHtmlString: '<b>x</b>' });
    });

    it('keeps object renderer results structured', () => {
        const result = format(() => ({ type: 'raw', rawHtmlString: '<b>x</b>', title: 't' }));

        expect(result.type).toBe('structured');
        expect(result).not.toHaveProperty('rawHtmlString');
        expect(result.title).toBe('t');
    });

    it('applies heading, title and data overrides', () => {
        const data = [{ label: 'a', value: 'b' }];
        const result = format(() => ({ heading: 'H', title: 'T', data }));

        expect(result).toMatchObject({ type: 'structured', heading: 'H', title: 'T', data });
    });

    it('clears content when an override is explicitly undefined', () => {
        const result = format(() => ({ title: undefined }));

        expect(result.title).toBeUndefined();
        expect(result.heading).toBe('h');
    });
});
