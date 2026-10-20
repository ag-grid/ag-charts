import { expect } from 'vitest';

import { type BBox, mapValues } from 'ag-charts-core';
import type {
    AgBaseChartOptions,
    AgCartesianAxisPosition,
    AgCartesianChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';

import type { setupMockCanvas } from '../../util/test/mockCanvas';
import * as examples from './examples';
import {
    type CartesianOrPolarTestCase,
    type ChartOrProxy,
    cartesianChartAssertions,
    compareImageSnapshot,
    deproxy,
    reverseAxes,
    waitForChartStability,
} from './utils';

/** Grid line styling that makes the band alternation of an axis easy to see in a snapshot. */
export const EXAMPLE_GRID_LINE = {
    width: 2,
    style: [
        { fill: 'red', fillOpacity: 0.1, stroke: 'red' },
        { fill: 'blue', fillOpacity: 0.1, stroke: 'blue' },
        { fill: 'green', fillOpacity: 0.1, stroke: 'green' },
        { fill: 'yellow', fillOpacity: 0.1, stroke: 'yellow' },
    ],
};

/** The axis types the `interval.placement` tests run against. */
export const INTERVAL_AXIS_TYPES = ['category', 'grouped-category', 'unit-time', 'ordinal-time'];

export function applyRotation<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, rotation: number): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, label: { ...axis.label, rotation } })),
    };
}

/**
 * As {@link applyRotation}, but with label collision avoidance off so that the rotated labels are never
 * hidden. The grouped category axis tests need every label drawn.
 */
export function applyRotationWithoutCollisionAvoidance<T extends AgCartesianChartOptions | AgPolarChartOptions>(
    opts: T,
    rotation: number
): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({
            ...axis,
            label: { ...axis.label, rotation, avoidCollisions: false },
        })),
    };
}

export function applyAxesFlip<T extends AgCartesianChartOptions>(opts: T): T {
    const positionFlip = (position?: AgCartesianAxisPosition) => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'left':
                return 'right';
            case 'bottom':
                return 'top';
            case 'right':
                return 'left';
            default:
                return position;
        }
    };

    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) => ({ ...axis, position: positionFlip(axis.position) })),
    };
}

/**
 * Adds a `_MANUAL_ROTATION`, `_FLIP` and `_REVERSED_AXES` variant of every case. Pass
 * {@link applyRotationWithoutCollisionAvoidance} as `rotate` to keep every rotated label.
 */
export function mixinDerivedCases<C extends { options: AgBaseChartOptions }>(
    baseCases: Record<string, C>,
    rotate: typeof applyRotation = applyRotation
): Record<string, C> {
    const result = { ...baseCases };

    for (const name of Object.keys(baseCases)) {
        const baseCase = baseCases[name];
        // Add manual rotation.
        result[name + '_MANUAL_ROTATION'] = {
            ...baseCase,
            options: rotate(baseCase.options, -30),
        };

        // Add flipped axes.
        result[name + '_FLIP'] = {
            ...baseCase,
            options: applyAxesFlip(baseCase.options),
        };

        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
        };
    }

    return result;
}

function applyInterval<T extends AgCartesianChartOptions>(
    opts: T,
    placement: 'on' | 'between',
    axisTypes: readonly string[]
): T {
    return {
        ...opts,
        axes: mapValues(opts.axes ?? {}, (axis) =>
            axis.type != null && axisTypes.includes(axis.type)
                ? {
                      ...axis,
                      interval: { ...(axis.interval ?? {}), placement },
                      gridLine: EXAMPLE_GRID_LINE,
                      tick: { ...(axis.tick ?? {}), enabled: true },
                  }
                : axis
        ),
    };
}

/** Places the interval ticks of the `axisTypes` axes on the category boundaries, with a styled grid line. */
export function applyIntervalOn<T extends AgCartesianChartOptions>(
    opts: T,
    axisTypes: readonly string[] = INTERVAL_AXIS_TYPES
): T {
    return applyInterval(opts, 'on', axisTypes);
}

/** Places the interval ticks of the `axisTypes` axes between the categories, with a styled grid line. */
export function applyIntervalBetween<T extends AgCartesianChartOptions>(
    opts: T,
    axisTypes: readonly string[] = INTERVAL_AXIS_TYPES
): T {
    return applyInterval(opts, 'between', axisTypes);
}

export function calculateAxisBBox(axis: { getBBox(): BBox }): { x: number; y: number; width: number; height: number } {
    const { x, y, width, height } = axis.getBBox();
    return { x, y, width, height };
}

/** A category x-axis, log y-axis case for the given series type. */
export function buildLogAxisTestCase(
    seriesType: 'line' | 'bar' | 'area',
    data: any[],
    extra?: { warnings?: string[]; skipWarningsReversed?: boolean }
): CartesianOrPolarTestCase {
    return {
        options: examples.CARTESIAN_CATEGORY_X_AXIS_LOG_Y_AXIS(data, seriesType),
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'log' }, seriesTypes: [seriesType] }),
        ...extra,
    };
}

export interface AxisSnapshotOptions {
    /** Only the axes of these types are snapshotted; every axis when omitted. */
    types?: readonly string[];
    /**
     * Also record each axis' bounding box as a text snapshot, and skip an axis whose box is smaller than a pixel
     * (an axis the chart did not lay out).
     */
    snapshotBBox?: boolean;
}

/**
 * Image-snapshots each axis of `chart` cropped to its bounding box, in axis order, with one baseline per axis.
 * The baseline names are numbered by call order, so the calls made here are what a suite's baselines are keyed to.
 */
export async function compareAxisSnapshots(
    chartOrProxy: ChartOrProxy<any>,
    ctx: ReturnType<typeof setupMockCanvas>,
    { types, snapshotBBox = false }: AxisSnapshotOptions = {}
): Promise<void> {
    for (const axis of deproxy(chartOrProxy).axes) {
        if (types != null && !types.includes(axis.type)) {
            continue;
        }

        await waitForChartStability(chartOrProxy);
        const bbox = calculateAxisBBox(axis);

        if (snapshotBBox) {
            expect(bbox).toMatchSnapshot();
            if (bbox.width < 1 || bbox.height < 1) {
                continue;
            }
        }

        await compareImageSnapshot(chartOrProxy, { ...ctx, bbox });
    }
}
