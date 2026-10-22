import { describe, expect, it } from 'vitest';

import {
    fakeComputedStyle,
    functionAt,
    invalidOption,
    omitSeriesData,
    optionAt,
    partialModule,
    strictOptionAt,
    valuesAt,
} from './moduleAccessors';

describe('moduleAccessors', () => {
    describe('invalidOption', () => {
        it('returns the value it was given, unchanged', () => {
            const value = { type: 'lien' };

            expect(invalidOption(value)).toBe(value);
            expect(invalidOption('notanumber')).toBe('notanumber');
        });
    });

    describe('optionAt', () => {
        const options = { highlight: { mode: 'shared' }, series: [{ label: { padding: 8 } }, { visible: false }] };

        it('reads a nested value', () => {
            expect(optionAt(options, 'highlight.mode')).toBe('shared');
        });

        it('reads through an array index', () => {
            expect(optionAt(options, 'series[0].label.padding')).toBe(8);
            expect(optionAt(options, 'series[1].visible')).toBe(false);
        });

        it('reads a key containing a hyphen', () => {
            expect(optionAt({ overrides: { 'radial-bar': 1 } }, 'overrides.radial-bar')).toBe(1);
        });

        it('is undefined as soon as a segment is missing', () => {
            expect(optionAt(options, 'legend.item.padding')).toBeUndefined();
            expect(optionAt(options, 'series[2].label')).toBeUndefined();
            expect(optionAt(options, 'highlight.mode.deeper')).toBeUndefined();
        });

        it('is undefined for a missing root', () => {
            expect(optionAt(undefined, 'a.b')).toBeUndefined();
            expect(optionAt(null, 'a')).toBeUndefined();
        });

        it('returns the root for an empty path', () => {
            expect(optionAt(options, '')).toBe(options);
        });
    });

    describe('partialModule', () => {
        it('returns the members it was given, unchanged', () => {
            const members = { type: 'series', name: 'line', stackable: true };

            expect(partialModule(members)).toBe(members);
        });
    });

    describe('strictOptionAt', () => {
        const options = { highlight: { mode: 'shared' }, series: [{ label: { padding: 8 }, fill: undefined }] };

        it('reads the leaf, which may be absent, when its parent exists', () => {
            expect(strictOptionAt(options, 'highlight.mode')).toBe('shared');
            expect(strictOptionAt(options, 'highlight.other')).toBeUndefined();
            expect(strictOptionAt(options, 'series[0].fill')).toBeUndefined();
            expect(strictOptionAt(options, 'series[0].label.padding')).toBe(8);
        });

        it('fails when the parent is missing, where `optionAt` is just undefined', () => {
            expect(() => strictOptionAt(options, 'legend.enabled')).toThrow('the parent of legend.enabled');
            expect(() => strictOptionAt(options, 'series[1].fill')).toThrow('the parent of series[1].fill');
            expect(() => strictOptionAt(options, 'series[0].label.border.enabled')).toThrow('label.border');
            expect(optionAt(options, 'legend.enabled')).toBeUndefined();
        });

        it('reads a top-level leaf from the root', () => {
            expect(strictOptionAt(options, 'highlight')).toBe(options.highlight);
        });
    });

    describe('valuesAt', () => {
        const options = { axes: { x: { type: 'category' }, y: { type: 'number' } }, title: 'text' };

        it('lists the values of the object at the path', () => {
            expect(valuesAt(options, 'axes')).toEqual([{ type: 'category' }, { type: 'number' }]);
        });

        it('fails when the path is missing or not an object', () => {
            expect(() => valuesAt(options, 'legend')).toThrow();
            expect(() => valuesAt(options, 'title')).toThrow();
        });
    });

    describe('omitSeriesData', () => {
        it('copies the options with each series stripped of its data, leaving the original intact', () => {
            const options = { title: 'chart', series: [{ type: 'bar', data: [1, 2] }, { type: 'line' }] };

            expect(omitSeriesData(options)).toEqual({ title: 'chart', series: [{ type: 'bar' }, { type: 'line' }] });
            expect(options.series[0]).toEqual({ type: 'bar', data: [1, 2] });
        });

        it('copies options without series as they are', () => {
            expect(omitSeriesData({ title: 'chart' })).toEqual({ title: 'chart' });
        });
    });

    describe('functionAt', () => {
        it('returns the function at the path, callable', () => {
            const options = { tooltip: { renderer: ({ value }: { value?: number }) => (value ?? 0) + 1 } };

            expect(functionAt(options, 'tooltip.renderer')({ value: 1 })).toBe(2);
        });

        it('fails for a path that is not a function', () => {
            expect(() => functionAt({ tooltip: {} }, 'tooltip.renderer')).toThrow();
        });
    });

    describe('fakeComputedStyle', () => {
        const style = fakeComputedStyle({ '--bad': 'not-a-color' });

        it('answers a listed property', () => {
            expect(style.getPropertyValue('--bad')).toBe('not-a-color');
        });

        it('answers an empty string for a property it does not list', () => {
            expect(style.getPropertyValue('--other')).toBe('');
        });
    });
});
