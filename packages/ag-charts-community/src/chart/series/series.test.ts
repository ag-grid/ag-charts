import { describe, expect, it } from 'vitest';

import type { InteractionRange } from 'ag-charts-types';

import type { SeriesNodePickIntent } from './series';
import { MARKERLESS_NODE_PICK_RANGE, SeriesNodePickMode, resolveNodePickModes } from './series';

describe('resolveNodePickModes', () => {
    // A marker-based cartesian series' declared pick modes (e.g. line series).
    const LINE_PICK_MODES = [
        SeriesNodePickMode.AXIS_ALIGNED,
        SeriesNodePickMode.NEAREST_NODE,
        SeriesNodePickMode.EXACT_SHAPE_MATCH,
    ] as const;

    const resolve = (params: {
        pickModes?: readonly SeriesNodePickMode[];
        intent?: SeriesNodePickIntent;
        tooltipRange?: InteractionRange;
        nodeClickRange?: InteractionRange;
        exactMatchOnly?: boolean;
        hasPickableNodeShapes: boolean;
    }) =>
        resolveNodePickModes({
            pickModes: params.pickModes ?? LINE_PICK_MODES,
            intent: params.intent ?? 'event',
            tooltipRange: params.tooltipRange,
            nodeClickRange: params.nodeClickRange,
            exactMatchOnly: params.exactMatchOnly ?? false,
            hasPickableNodeShapes: params.hasPickableNodeShapes,
        });

    describe(`nodeClickRange: 'exact'`, () => {
        it('narrows to EXACT_SHAPE_MATCH when node shapes are pickable', () => {
            const { maxDistance, selectedPickModes } = resolve({
                nodeClickRange: 'exact',
                hasPickableNodeShapes: true,
            });

            expect(selectedPickModes).toEqual([SeriesNodePickMode.EXACT_SHAPE_MATCH]);
            expect(maxDistance).toBe(Infinity);
        });

        it('falls through to the geometric pick modes when no node shapes are pickable', () => {
            const { maxDistance, selectedPickModes } = resolve({
                nodeClickRange: 'exact',
                hasPickableNodeShapes: false,
            });

            expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
            expect(selectedPickModes).toContain(SeriesNodePickMode.NEAREST_NODE);
            expect(selectedPickModes).toContain(SeriesNodePickMode.AXIS_ALIGNED);
            expect(maxDistance).toBe(MARKERLESS_NODE_PICK_RANGE);
            expect(maxDistance).toBe(10);
        });

        it(`applies the fall-through for the 'context-menu' intent too`, () => {
            const { maxDistance, selectedPickModes } = resolve({
                intent: 'context-menu',
                nodeClickRange: 'exact',
                hasPickableNodeShapes: false,
            });

            expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
            expect(maxDistance).toBe(MARKERLESS_NODE_PICK_RANGE);
        });

        it('leaves a series with only geometric pick modes with nothing to pick when shapes are pickable', () => {
            // rangeArea declares only AXIS_ALIGNED, so 'exact' filters to nothing - pre-existing behaviour.
            const { selectedPickModes } = resolve({
                pickModes: [SeriesNodePickMode.AXIS_ALIGNED],
                nodeClickRange: 'exact',
                hasPickableNodeShapes: true,
            });

            expect(selectedPickModes).toEqual([]);
        });

        it('restores AXIS_ALIGNED for a geometric-only series when no shapes are pickable', () => {
            const { maxDistance, selectedPickModes } = resolve({
                pickModes: [SeriesNodePickMode.AXIS_ALIGNED],
                nodeClickRange: 'exact',
                hasPickableNodeShapes: false,
            });

            expect(selectedPickModes).toEqual([SeriesNodePickMode.AXIS_ALIGNED]);
            expect(maxDistance).toBe(MARKERLESS_NODE_PICK_RANGE);
        });
    });

    describe('tooltip intents are unchanged', () => {
        it.each(['tooltip', 'highlight-tooltip'] as const)(
            `keeps tooltipRange: 'exact' exact-only regardless of pickable node shapes (%s)`,
            (intent) => {
                const pickable = resolve({ intent, tooltipRange: 'exact', hasPickableNodeShapes: true });
                const notPickable = resolve({ intent, tooltipRange: 'exact', hasPickableNodeShapes: false });

                expect(notPickable).toEqual(pickable);
                expect(notPickable.selectedPickModes).toEqual([SeriesNodePickMode.EXACT_SHAPE_MATCH]);
                expect(notPickable.maxDistance).toBe(Infinity);
            }
        );

        it('ignores nodeClickRange for a tooltip intent', () => {
            const { maxDistance, selectedPickModes } = resolve({
                intent: 'tooltip',
                tooltipRange: 'nearest',
                nodeClickRange: 'exact',
                hasPickableNodeShapes: false,
            });

            expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
            expect(maxDistance).toBe(Infinity);
        });
    });

    // AC3: `highlight.range: 'node'` maps to the bare 'highlight' intent, which must key off neither
    // range option - adding a branch for it would reintroduce the markerless bug this change removes.
    it.each([true, false])(
        `leaves the bare 'highlight' intent unbounded and unfiltered (hasPickableNodeShapes: %s)`,
        (hasPickableNodeShapes) => {
            const { maxDistance, selectedPickModes } = resolve({
                intent: 'highlight',
                nodeClickRange: 'exact',
                tooltipRange: 'exact',
                hasPickableNodeShapes,
            });

            expect(maxDistance).toBe(Infinity);
            expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
        }
    );

    it(`never overrides a caller's exactMatchOnly assertion`, () => {
        const { selectedPickModes } = resolve({
            nodeClickRange: 'exact',
            exactMatchOnly: true,
            hasPickableNodeShapes: false,
        });

        expect(selectedPickModes).toEqual([SeriesNodePickMode.EXACT_SHAPE_MATCH]);
    });

    it('honours a numeric nodeClickRange irrespective of pickable node shapes', () => {
        for (const hasPickableNodeShapes of [true, false]) {
            const { maxDistance, selectedPickModes } = resolve({ nodeClickRange: 20, hasPickableNodeShapes });

            expect(maxDistance).toBe(20);
            expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
        }
    });

    it(`leaves nodeClickRange: 'nearest' unbounded and unfiltered`, () => {
        const { maxDistance, selectedPickModes } = resolve({
            nodeClickRange: 'nearest',
            hasPickableNodeShapes: false,
        });

        expect(maxDistance).toBe(Infinity);
        expect(selectedPickModes).toEqual([...LINE_PICK_MODES]);
    });
});
