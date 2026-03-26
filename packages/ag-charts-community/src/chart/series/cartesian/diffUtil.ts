import { type Scaling, areScalingEqual } from 'ag-charts-core';

import type { ProcessedData, ProcessedOutputDiff } from '../../data/dataModel';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeriesTypes';

export function calculateDataDiff<N extends CartesianSeriesNodeDatum>(
    seriesId: string,
    datumSelection: Iterable<{ datum: N }>,
    getDatumId: (datum: N) => string,
    contextNodeData: CartesianSeriesNodeDataContext<N, any>,
    previousContextNodeData?: CartesianSeriesNodeDataContext<N, any>,
    processedData?: ProcessedData<unknown>,
    processedDataUpdated?: boolean
): ProcessedOutputDiff | undefined {
    let dataDiff = processedData?.reduced?.diff?.[seriesId];
    if (dataDiff?.changed) {
        return dataDiff;
    }

    if (!processedDataUpdated) {
        // CRT-965: Treat domain update (with no data-reprocessing) as a data diff no-op.
        return {
            changed: false,
            added: new Set(),
            updated: new Set(),
            removed: new Set(),
            moved: new Set(),
        };
    }

    const scalingChanged = hasScalingChanged(contextNodeData, previousContextNodeData);
    if (dataDiff == null && processedData?.reduced?.diff != null) {
        dataDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(),
            removed: new Set(),
            moved: new Set(),
        };
        if (scalingChanged) {
            dataDiff.updated = new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum)));
        } else {
            dataDiff.added = new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum)));
        }
    } else if (scalingChanged) {
        dataDiff = {
            changed: true,
            added: new Set(),
            updated: new Set(Array.from(datumSelection, ({ datum }) => getDatumId(datum))),
            removed: new Set(),
            moved: new Set(),
        };
    }

    return dataDiff;
}

function isGroupScaleContext(ctx: unknown): ctx is { groupScale: Scaling } {
    return typeof ctx === 'object' && ctx !== null && 'groupScale' in ctx;
}

function hasScalingChanged(
    contextNodeData: CartesianSeriesNodeDataContext,
    previousContextNodeData?: CartesianSeriesNodeDataContext
) {
    if (!previousContextNodeData) return false;

    const scales = contextNodeData.scales;
    const prevScales = previousContextNodeData.scales;
    if (!areScalingEqual(scales.x, prevScales.x)) return true;
    if (!areScalingEqual(scales.y, prevScales.y)) return true;

    if (!isGroupScaleContext(contextNodeData) || !isGroupScaleContext(previousContextNodeData)) return false;
    const groupScale = contextNodeData.groupScale;
    const prevGroupScale = previousContextNodeData.groupScale;
    return !areScalingEqual(groupScale, prevGroupScale);
}
