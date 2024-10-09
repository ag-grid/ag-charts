import { _ModuleSupport } from 'ag-charts-community';

import type { FunnelConnector } from './funnelConnector';

const { NODE_UPDATE_STATE_TO_PHASE_MAPPING } = _ModuleSupport;

type AnimatableConnectorDatum = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    x3: number;
    y3: number;
    opacity: number | undefined;
};

function connectorStartingPosition(
    datum: AnimatableConnectorDatum,
    _prevDatum: AnimatableConnectorDatum,
    isVertical: boolean,
    _mode: 'normal' | 'fade'
): AnimatableConnectorDatum {
    const { x0, y0, x1, y1, x2, y2, x3, y3, opacity } = datum;

    if (isVertical) {
        return {
            x0: (x0 + x3) / 2,
            y0: (y0 + y3) / 2,
            x1: (x1 + x2) / 2,
            y1: (y1 + y2) / 2,
            x2: (x1 + x2) / 2,
            y2: (y1 + y2) / 2,
            x3: (x0 + x3) / 2,
            y3: (y0 + y3) / 2,
            opacity,
        };
    } else {
        return {
            x0: (x0 + x1) / 2,
            y0: (y0 + y1) / 2,
            x1: (x0 + x1) / 2,
            y1: (y0 + y1) / 2,
            x2: (x2 + x3) / 2,
            y2: (y2 + y3) / 2,
            x3: (x2 + x3) / 2,
            y3: (y2 + y3) / 2,
            opacity,
        };
    }
}

export function prepareConnectorAnimationFunctions<T extends AnimatableConnectorDatum>(
    isVertical: boolean,
    mode: 'normal' | 'fade'
) {
    const isRemoved = (datum?: T) => datum == null;

    const fromFn: _ModuleSupport.FromToMotionPropFn<FunnelConnector, AnimatableConnectorDatum, T> = (
        connector: FunnelConnector,
        datum: T,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        if (status === 'updated' && isRemoved(datum)) {
            status = 'removed';
        } else if (status === 'updated' && isRemoved(connector.previousDatum)) {
            status = 'added';
        }

        // Continue from current rendering location.
        let source: AnimatableConnectorDatum;
        if (status === 'added' && connector.previousDatum == null && mode === 'fade') {
            // Handle series add case, after initial load. This is distinct from legend toggle on.
            source = { ...resetConnectorSelectionsFn(connector, datum), opacity: 0 };
        } else if (status === 'unknown' || status === 'added') {
            source = connectorStartingPosition(datum, connector.previousDatum, isVertical, mode);
        } else {
            source = {
                x0: connector.x0,
                y0: connector.y0,
                x1: connector.x1,
                y1: connector.y1,
                x2: connector.x2,
                y2: connector.y2,
                x3: connector.x3,
                y3: connector.y3,
                opacity: connector.opacity,
            };
        }

        const phase = NODE_UPDATE_STATE_TO_PHASE_MAPPING[status];
        return { ...source, phase };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<FunnelConnector, AnimatableConnectorDatum, T> = (
        connector: FunnelConnector,
        datum: T,
        status: _ModuleSupport.NodeUpdateState
    ) => {
        let source: AnimatableConnectorDatum;
        if (status === 'removed' && connector.datum == null && mode === 'fade') {
            // Handle series remove case, after initial load. This is distinct from legend toggle off.
            source = { ...resetConnectorSelectionsFn(connector, datum), opacity: 0 };
        } else if (status === 'removed' || isRemoved(datum)) {
            source = connectorStartingPosition(datum, connector.previousDatum, isVertical, mode);
        } else {
            source = resetConnectorSelectionsFn(connector, datum);
        }

        return source;
    };

    return { fromFn, toFn };
}

export function resetConnectorSelectionsFn(_node: FunnelConnector, datum: AnimatableConnectorDatum) {
    const { x0, y0, x1, y1, x2, y2, x3, y3, opacity } = datum;
    return { x0, y0, x1, y1, x2, y2, x3, y3, opacity };
}
