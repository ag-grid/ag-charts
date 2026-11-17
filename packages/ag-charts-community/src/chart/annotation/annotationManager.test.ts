import { beforeEach, describe, expect, it, vi } from 'vitest';

import { lineDashOptionsDef, number, string } from 'ag-charts-core';
import type { OptionsDefs } from 'ag-charts-core';
import type { AgAnnotation } from 'ag-charts-types';

import { AnnotationManager } from './annotationManager';

describe('AnnotationManager', () => {
    const warn = vi.fn();
    const emit = vi.fn();
    const stateDefs = {
        type: string,
        strokeWidth: number,
        ...lineDashOptionsDef,
    } as unknown as OptionsDefs<AgAnnotation>;

    let manager: AnnotationManager;

    // The memento predates `lineStyle` being removed from the types, so a legacy state is cast.
    const restore = (...annotations: Record<string, unknown>[]) => {
        manager.restoreMemento('', '', annotations as unknown as AgAnnotation[]);
        return manager.createMemento() as unknown as Record<string, unknown>[];
    };

    beforeEach(() => {
        warn.mockClear();
        emit.mockClear();
        manager = new AnnotationManager({ logger: { warn }, eventsHub: { emit } } as any, stateDefs);
    });

    describe('legacy lineStyle', () => {
        it.each([
            ['solid', 'solid'],
            ['dashed', 'dash'],
            ['dotted', 'dot'],
        ])('migrates lineStyle %s to the %s dash name', (lineStyle, lineDash) => {
            expect(restore({ type: 'line', lineStyle })).toEqual([{ type: 'line', lineDash }]);
            expect(warn).not.toHaveBeenCalled();
        });

        it('lets an explicit lineDash win over lineStyle and still drops lineStyle', () => {
            expect(restore({ type: 'line', lineStyle: 'dotted', lineDash: [8, 3] })).toEqual([
                { type: 'line', lineDash: [8, 3] },
            ]);
            expect(restore({ type: 'line', lineStyle: 'dotted', lineDash: 'long-dash' })).toEqual([
                { type: 'line', lineDash: 'long-dash' },
            ]);
        });

        it('drops a lineStyle that has no matching name', () => {
            expect(restore({ type: 'line', lineStyle: 'wavy' })).toEqual([{ type: 'line' }]);
            expect(restore({ type: 'line', lineStyle: 3 })).toEqual([{ type: 'line' }]);
        });

        it('treats a null lineDash as unset', () => {
            expect(restore({ type: 'line', lineStyle: 'dashed', lineDash: null })).toEqual([
                { type: 'line', lineDash: 'dash' },
            ]);
        });

        it('migrates each annotation independently and keeps their other fields', () => {
            expect(
                restore(
                    { type: 'line', lineStyle: 'dashed', strokeWidth: 3 },
                    { type: 'line', lineDash: 'dot', strokeWidth: 2 },
                    { type: 'line', strokeWidth: 1 }
                )
            ).toEqual([
                { type: 'line', lineDash: 'dash', strokeWidth: 3 },
                { type: 'line', lineDash: 'dot', strokeWidth: 2 },
                { type: 'line', strokeWidth: 1 },
            ]);
        });

        it('does not mutate the memento it is given', () => {
            const legacy = { type: 'line', lineStyle: 'dashed' };

            restore(legacy);

            expect(legacy).toEqual({ type: 'line', lineStyle: 'dashed' });
        });

        it('leaves a state with no lineStyle alone', () => {
            expect(restore({ type: 'line', lineDash: 'dash-dot' })).toEqual([{ type: 'line', lineDash: 'dash-dot' }]);
            expect(restore()).toEqual([]);
        });
    });
});
