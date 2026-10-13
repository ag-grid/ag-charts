import { describe, expect, it, vi } from 'vitest';

import { ChartAxisDirection, OrdinalTimeScale, TimeScale } from 'ag-charts-core';
import type { AgZoomEventSource } from 'ag-charts-types';

import { DataWindowProcessor } from './dataWindowProcessor';

describe('DataWindowProcessor', () => {
    const day = 1000 * 60 * 60 * 24;
    const start = new Date('2024-01-01 00:00:00').getTime();
    const dates = Array.from({ length: 101 }, (_, i) => new Date(start + i * day));

    function build(scale: OrdinalTimeScale | TimeScale) {
        scale.domain = scale instanceof OrdinalTimeScale ? dates : [dates[0], dates.at(-1)!];
        scale.range = [0, 600];

        const listeners = new Map<string, Array<(event: any) => void>>();
        const eventsHub = {
            on: (name: string, listener: (event: any) => void) => {
                listeners.set(name, [...(listeners.get(name) ?? []), listener]);
                return () => {};
            },
            emit: (name: string, event?: any) => {
                for (const listener of listeners.get(name) ?? []) listener(event);
            },
        };

        let zoom = { min: 0, max: 1 };
        const load = vi.fn();
        const axis = { id: 'x', type: 'axis', scale, direction: ChartAxisDirection.X };

        const processor = new DataWindowProcessor(
            { axes: [axis] } as any,
            {
                eventsHub,
                dataService: { isLazy: () => true, load },
                chartState: { getValue: () => ({ x: zoom }) },
                animationManager: { skip: () => {} },
            } as any
        );

        const zoomTo = (max: number, source: AgZoomEventSource) => {
            zoom = { min: 0, max };
            eventsHub.emit('zoom:change-complete', { source });
            eventsHub.emit('update:complete', {});
        };

        return { processor, load, zoomTo };
    }

    it.each([
        ['time', () => new TimeScale(), 2],
        ['ordinal-time', () => new OrdinalTimeScale(), 1],
    ] as const)(
        'handles a data-update that only narrows the window on a %s axis',
        (_axisType, createScale, expectedRequests) => {
            const { load, zoomTo } = build(createScale());

            zoomTo(1, 'user-interaction');
            zoomTo(0.5, 'data-update');

            expect(load).toHaveBeenCalledTimes(expectedRequests);
        }
    );

    it('still requests a window that only narrows when the user caused it', () => {
        const { load, zoomTo } = build(new OrdinalTimeScale());

        zoomTo(1, 'user-interaction');
        zoomTo(0.5, 'user-interaction');

        expect(load).toHaveBeenCalledTimes(2);
    });

    it('still requests a data-update window that widens on an ordinal-time axis', () => {
        const { load, zoomTo } = build(new OrdinalTimeScale());

        zoomTo(0.5, 'user-interaction');
        zoomTo(1, 'data-update');

        expect(load).toHaveBeenCalledTimes(2);
    });
});
