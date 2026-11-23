import { describe, expect, it } from 'vitest';

import { Group } from 'ag-charts-core';

import { SeriesLayerManager } from './seriesLayerManager';

interface FakeSeries {
    id: string;
    type: string;
    order: number;
    stack?: number;
    hovered?: boolean;
    selected?: boolean;
}

function addSeries(manager: SeriesLayerManager, { id, type, order, stack, hovered, selected }: FakeSeries) {
    const raised = hovered === true || selected === true;
    const config = {
        id,
        internalId: `internal-${id}`,
        type,
        seriesGrouping: stack == null ? undefined : { groupIndex: stack, groupCount: 1, stackIndex: 0, stackCount: 1 },
        contentGroup: new Group(),
        bringToFront: () => raised,
        raisedAtRest: () => selected === true,
        atRestZIndex: () => (selected === true ? 100 : order),
        renderToOffscreenCanvas: () => false,
    };
    manager.requestGroup(config);
    return config;
}

function atRestPaintOrder(series: FakeSeries[]) {
    const manager = new SeriesLayerManager(new Group());
    manager.setSeriesCount(series.length);
    for (const s of series) addSeries(manager, s);
    manager.updateLayerCompositing();
    return Object.fromEntries(manager.atRestPaintOrder());
}

describe('SeriesLayerManager', () => {
    describe('atRestPaintOrder', () => {
        it('ranks series by declaration order', () => {
            expect(
                atRestPaintOrder([
                    { id: 'a', type: 'bar', order: 0 },
                    { id: 'b', type: 'bar', order: 1 },
                ])
            ).toEqual({ a: 0, b: 1 });
        });

        it('draws a series sharing a layer with an earlier one under a series declared between them', () => {
            expect(
                atRestPaintOrder([
                    { id: 'low', type: 'bar', order: 0, stack: 0 },
                    { id: 'line', type: 'line', order: 1 },
                    { id: 'high', type: 'bar', order: 2, stack: 0 },
                ])
            ).toEqual({ low: 0, high: 1, line: 2 });
        });

        it('honours a data-selection raise', () => {
            expect(
                atRestPaintOrder([
                    { id: 'a', type: 'bar', order: 0, selected: true },
                    { id: 'b', type: 'bar', order: 1 },
                ])
            ).toEqual({ a: 1, b: 0 });
        });

        it('reuses its ranks until a series changes group', () => {
            const manager = new SeriesLayerManager(new Group());
            addSeries(manager, { id: 'a', type: 'bar', order: 0 });
            const first = manager.atRestPaintOrder();
            expect(manager.atRestPaintOrder()).toBe(first);

            addSeries(manager, { id: 'b', type: 'bar', order: 1 });
            expect(Object.fromEntries(manager.atRestPaintOrder())).toEqual({ a: 0, b: 1 });
        });

        it('drops a released series from its ranks', () => {
            const manager = new SeriesLayerManager(new Group());
            const a = addSeries(manager, { id: 'a', type: 'bar', order: 0 });
            addSeries(manager, { id: 'b', type: 'bar', order: 1 });
            expect(Object.fromEntries(manager.atRestPaintOrder())).toEqual({ a: 0, b: 1 });

            manager.releaseGroup(a);
            expect(Object.fromEntries(manager.atRestPaintOrder())).toEqual({ b: 0 });
        });

        it('recomputes its ranks when the series count changes', () => {
            const manager = new SeriesLayerManager(new Group());
            addSeries(manager, { id: 'a', type: 'bar', order: 0 });
            const first = manager.atRestPaintOrder();

            manager.setSeriesCount(2);
            expect(manager.atRestPaintOrder()).not.toBe(first);
        });

        it('ignores a hover raise', () => {
            expect(
                atRestPaintOrder([
                    { id: 'a', type: 'bar', order: 0, hovered: true },
                    { id: 'b', type: 'bar', order: 1 },
                ])
            ).toEqual({ a: 0, b: 1 });
        });

        it('ranks series raised together in the order their layers were created', () => {
            expect(
                atRestPaintOrder([
                    { id: 'a', type: 'bar', order: 0, selected: true },
                    { id: 'b', type: 'bar', order: 1, selected: true },
                    { id: 'c', type: 'bar', order: 2 },
                ])
            ).toEqual({ a: 1, b: 2, c: 0 });
        });
    });
});
