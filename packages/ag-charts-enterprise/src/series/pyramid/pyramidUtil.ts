import type { Direction, _ModuleSupport } from 'ag-charts-community';

import type { FunnelConnector } from '../funnel/funnelConnector';

type AnimatablePyramidDatum = {
    x: number;
    y: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
};

export function applyPyramidDatum(
    connector: FunnelConnector,
    { x, y, top, right, bottom, left }: AnimatablePyramidDatum
) {
    connector.x0 = x - top / 2;
    connector.x1 = x + top / 2;
    connector.x2 = x + bottom / 2;
    connector.x3 = x - bottom / 2;
    connector.y0 = y - left / 2;
    connector.y1 = y - right / 2;
    connector.y2 = y + right / 2;
    connector.y3 = y + left / 2;
}

export function preparePyramidAnimationFunctions<T extends AnimatablePyramidDatum>(direction: Direction) {
    const fromFn: _ModuleSupport.FromToMotionPropFn<FunnelConnector, AnimatablePyramidDatum, T> = (
        _connector,
        datum
    ) => {
        const { x, y } = datum;
        let { top, right, bottom, left } = datum;
        if (direction === 'vertical') {
            top = 0;
            bottom = 0;
        } else {
            left = 0;
            right = 0;
        }
        return { x, y, top, right, bottom, left };
    };
    const toFn: _ModuleSupport.FromToMotionPropFn<FunnelConnector, AnimatablePyramidDatum, T> = (_connector, datum) => {
        const { x, y, top, right, bottom, left } = datum;
        return { x, y, top, right, bottom, left };
    };
    const applyFn: _ModuleSupport.ApplyFn<FunnelConnector, AnimatablePyramidDatum> = applyPyramidDatum;

    return { fromFn, toFn, applyFn };
}
