import { describe, expect, it } from 'vitest';

import { type LabelFit, fitLabelText } from 'ag-charts-core';
import type { TextWrap } from 'ag-charts-types';

import { setupMockCanvas } from '../util/test/mockCanvas';
import { setupMockConsole } from '../util/test/mockConsole';
import { fitLabelToContainer } from './labelUtil';

const ELLIPSIS = '…';
const FONT = { fontFamily: 'Verdana', fontSize: 15 };
const LONG_TEXT = 'A very long label that will not fit';

function makeLabel(fit: {
    maxWidth?: number;
    maxHeight?: number;
    wrapping?: TextWrap;
    truncate?: boolean;
    avoid?: boolean;
}) {
    const { avoid = false, ...fitFields } = fit;
    return { ...FONT, ...fitFields, collisionAvoidance: { avoid } };
}

describe('fitLabelToContainer', () => {
    setupMockConsole();
    setupMockCanvas();

    it('returns the text unchanged when the policy resolves to show (no truncate, no avoidance)', () => {
        expect(fitLabelToContainer(LONG_TEXT, makeLabel({ maxWidth: 30 }), { width: 30, height: 100 })).toBe(LONG_TEXT);
        expect(fitLabelToContainer(LONG_TEXT, makeLabel({}), { width: 10, height: 10 })).toBe(LONG_TEXT);
    });

    it('clips to the container when no explicit bound is set', () => {
        const label = makeLabel({ truncate: true });
        const result = fitLabelToContainer(LONG_TEXT, label, { width: 40, height: 100 });
        expect(result).not.toBe(LONG_TEXT);
        expect(result).toContain(ELLIPSIS);
    });

    it('behaves like explicit-only fit when no container is supplied', () => {
        const label = makeLabel({ maxWidth: 40, truncate: true });
        expect(fitLabelToContainer(LONG_TEXT, label, undefined)).toBe(
            fitLabelText(
                LONG_TEXT,
                { maxWidth: 40, maxHeight: undefined, wrapping: undefined, overflowStrategy: 'ellipsis' },
                FONT
            )
        );
    });

    it('applies the explicit bound when it is tighter than the container', () => {
        const label = makeLabel({ maxWidth: 40, truncate: true });
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitLabelToContainer(LONG_TEXT, label, { width: 400, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('applies the container bound when it is tighter than the explicit bound', () => {
        const label = makeLabel({ maxWidth: 400, truncate: true });
        const expected: LabelFit = { maxWidth: 40, maxHeight: 400, wrapping: undefined, overflowStrategy: 'ellipsis' };
        expect(fitLabelToContainer(LONG_TEXT, label, { width: 40, height: 400 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('threads wrapping and truncate through to the fit', () => {
        const label = makeLabel({ wrapping: 'on-space', truncate: true });
        const result = fitLabelToContainer('one two three four', label, { width: 60, height: 400 });
        expect(typeof result).toBe('string');
        // on-space wrapping breaks the label across multiple lines within the narrow container.
        expect(String(result)).toContain('\n');
    });

    it('resolves collision avoidance to a hide overflow', () => {
        const label = makeLabel({ avoid: true });
        const expected: LabelFit = { maxWidth: 30, maxHeight: 100, wrapping: undefined, overflowStrategy: 'hide' };
        expect(fitLabelToContainer(LONG_TEXT, label, { width: 30, height: 100 })).toBe(
            fitLabelText(LONG_TEXT, expected, FONT)
        );
    });

    it('preserves rich-text segments as an array', () => {
        const segments = [{ type: 'text' as const, text: LONG_TEXT }];
        const result = fitLabelToContainer(segments, makeLabel({ truncate: true }), { width: 40, height: 100 });
        expect(Array.isArray(result)).toBe(true);
    });
});
