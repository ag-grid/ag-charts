import type { Scale } from 'ag-charts-core';

import type { ChartAxis } from '../chartAxis';
import type { ProcessedData } from '../data/dataModel';
import { processedDataUnchanged, sameArray, sameValue } from '../data/processedDataUnchanged';

type SeriesAxes = { [direction: string]: ChartAxis | undefined };

interface ScaleInputs {
    readonly direction: string;
    readonly axis: ChartAxis;
    readonly scale: Scale<any, any, any>;
    readonly domain: readonly unknown[];
    readonly domainMin: unknown;
    readonly domainMax: unknown;
    readonly range: readonly unknown[];
    readonly bandwidth: number | undefined;
    readonly step: number | undefined;
}

/** What a series' node data was built from: its processed data, and where each axis scale it reads put its values. */
export interface NodeDataInputs {
    readonly processedData: ProcessedData<any>;
    readonly scales: readonly ScaleInputs[];
}

function directionsOf(axes: SeriesAxes) {
    return Object.keys(axes).filter((direction) => axes[direction] != null);
}

export function captureNodeDataInputs(
    processedData: ProcessedData<any> | undefined,
    axes: SeriesAxes
): NodeDataInputs | undefined {
    if (processedData == null) return undefined;
    const scales = directionsOf(axes).map((direction): ScaleInputs => {
        const axis = axes[direction]!;
        const { scale } = axis;
        return {
            direction,
            axis,
            scale,
            domain: scale.domain.slice(),
            domainMin: scale.domainMin,
            domainMax: scale.domainMax,
            range: scale.range.slice(),
            bandwidth: scale.bandwidth,
            step: scale.step,
        };
    });
    return { processedData, scales };
}

function sameScale(captured: ScaleInputs, axis: ChartAxis | undefined): boolean {
    if (axis !== captured.axis) return false;
    const { scale } = axis;
    return (
        scale === captured.scale &&
        sameArray(captured.domain, scale.domain) &&
        sameValue(captured.domainMin, scale.domainMin) &&
        sameValue(captured.domainMax, scale.domainMax) &&
        sameArray(captured.range, scale.range) &&
        sameValue(captured.bandwidth, scale.bandwidth) &&
        sameValue(captured.step, scale.step)
    );
}

/**
 * Whether a rebuild of node data now would read what `inputs` recorded: the processed data holds the same values,
 * and every axis scale has the same domain and range. A direction that gained, lost or swapped its axis counts as
 * changed, and so does anything missing: unknown inputs mean a rebuild.
 */
export function nodeDataInputsUnchanged(
    inputs: NodeDataInputs | undefined,
    processedData: ProcessedData<any> | undefined,
    axes: SeriesAxes
): boolean {
    if (inputs == null || processedData == null) return false;
    if (directionsOf(axes).length !== inputs.scales.length) return false;
    for (const captured of inputs.scales) {
        if (!sameScale(captured, axes[captured.direction])) return false;
    }
    return processedDataUnchanged(inputs.processedData, processedData);
}
