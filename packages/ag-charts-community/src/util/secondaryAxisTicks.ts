import { countFractionDigits } from 'ag-charts-core';

import { findMinMax } from 'ag-charts-core/utils/numberArray';
import { createTicks, niceTicksDomain } from './ticks';

interface SecondaryTickScale<D> {
    toDomain(d: number): D;
}

export interface AxisPrimaryTickCount {
    unzoomed: number;
    zoomed: number;
}

export function calculateNiceSecondaryAxis<D extends number>(
    scale: SecondaryTickScale<D>,
    domain: D[],
    primaryTickCount: AxisPrimaryTickCount,
    reverse: boolean,
    visibleRange: [number, number]
): { domain: D[]; ticks: number[] } {
    // Make secondary axis domain nice using strict tick count, matching the tick count from the primary axis.
    // This is to make the secondary axis grid lines/ tick positions align with the ones from the primary axis.

    let [d0, d1] = findMinMax(domain.map(Number));

    const unzoomedTickCount = Math.floor(primaryTickCount.unzoomed);

    if (unzoomedTickCount <= 1) {
        // Force a domain that generates an odd number of ticks
        // This is so one of the ticks will align with the primary axis
        const [start, stop] = domainWithOddTickCount(d0, d1);

        // Single value in the primary axis
        const tickCount = 5 * Math.pow(2, -Math.ceil(Math.log2(visibleRange[1] - visibleRange[0])));
        const { ticks } = createTicks(start, stop, tickCount, undefined, undefined, visibleRange);

        const d = [scale.toDomain(start), scale.toDomain(stop)];
        if (reverse) d.reverse();

        return { domain: d, ticks };
    }

    if (d0 === d1) {
        // Single value in the secondary axis
        // Just create a reasonable domain
        const order = Math.floor(Math.log10(d0));
        const magnitude = Math.pow(10, order);

        const rangeOffsetStep = Math.min(magnitude, 1);
        const rangeOffset = unzoomedTickCount - 1;

        d0 -= rangeOffsetStep * Math.floor(rangeOffset / 2);
        d1 = d0 + rangeOffsetStep * rangeOffset;
    }

    let start = d0;
    let stop = d1;

    start = calculateNiceStart(start, stop, unzoomedTickCount);
    const baseStep = getTickStep(start, stop, unzoomedTickCount);

    const segments = unzoomedTickCount - 1;
    stop = start + segments * baseStep;

    // If we can align the start and stop to the base step - and be within the domain - we do so.
    const stepAlignedStart = Math.floor(start / baseStep) * baseStep;
    const stepAlignedStop = Math.floor(stop / baseStep) * baseStep;
    if (stepAlignedStart <= d0 && stepAlignedStop >= d1) {
        start = stepAlignedStart;
        stop = stepAlignedStop;
    }

    const d: [D, D] = [scale.toDomain(start), scale.toDomain(stop)];
    if (reverse) d.reverse();

    const step = baseStep * ((primaryTickCount.unzoomed - 1) / (primaryTickCount.zoomed - 1));
    const ticks = getTicks(start, step, Math.floor(primaryTickCount.zoomed));

    return { domain: d, ticks };
}

function domainWithOddTickCount(d0: number, d1: number): [number, number] {
    let start = d0;
    let stop = d1;
    let iterations = 0;
    do {
        [start, stop] = niceTicksDomain(start, stop);
        const { ticks } = createTicks(start, stop, 5);
        if (ticks.length % 2 === 1) return [start, stop];

        start -= 1;
        stop += 1;
    } while (iterations++ < 10);

    return [d0, d1];
}

function calculateNiceStart(a: number, b: number, count: number): number {
    a = Math.floor(a);
    const rawStep = Math.abs(b - a) / (count - 1);
    const order = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, order);

    return Math.floor(a / magnitude) * magnitude;
}

function getTicks(start: number, step: number, count: number): number[] {
    // power of the step will be negative if the step is a fraction (between 0 and 1)
    const fractionDigits = countFractionDigits(step);
    const f = Math.pow(10, fractionDigits);
    const ticks: number[] = [];

    for (let i = 0; i < count; i++) {
        const tick = start + step * i;
        ticks.push(Math.round(tick * f) / f);
    }

    return ticks;
}

function getTickStep(start: number, stop: number, count: number): number {
    const segments = count - 1;
    const rawStep = (stop - start) / segments;
    return calculateNextNiceStep(rawStep);
}

function calculateNextNiceStep(rawStep: number): number {
    const order = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, order);

    // Between 0-10
    const step = rawStep / magnitude;

    if (step > 0 && step <= 1) return magnitude;
    if (step > 1 && step <= 2) return 2 * magnitude;
    if (step > 2 && step <= 5) return 5 * magnitude;
    if (step > 5 && step <= 10) return 10 * magnitude;

    return rawStep;
}
