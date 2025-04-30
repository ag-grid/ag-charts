import { countFractionDigits } from 'ag-charts-core';

import { findMinMax } from './number';

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
    reverse: boolean
): { domain: [D, D]; ticks: number[] } {
    // Make secondary axis domain nice using strict tick count, matching the tick count from the primary axis.
    // This is to make the secondary axis grid lines/ tick positions align with the ones from the primary axis.

    const [d0, d1] = findMinMax(domain.map(Number));

    let start = d0;
    let stop = d1;

    start = calculateNiceStart(Math.floor(start), stop, primaryTickCount.unzoomed);
    const baseStep = getTickStep(start, stop, primaryTickCount.unzoomed);

    const segments = primaryTickCount.unzoomed - 1;
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
    const ticks = getTicks(start, step, primaryTickCount.zoomed);

    return { domain: d, ticks };
}

function calculateNiceStart(a: number, b: number, count: number): number {
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
        ticks[i] = Math.round(tick * f) / f;
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
