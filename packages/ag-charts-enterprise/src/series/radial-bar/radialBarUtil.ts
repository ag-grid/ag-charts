import { _ModuleSupport, type _Scene } from 'ag-charts-community';

const { ChartAxisDirection } = _ModuleSupport;

type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};

export function prepareRadialBarSeriesAnimationFunctions(
    axes: Record<_ModuleSupport.ChartAxisDirection, _ModuleSupport.ChartAxis | undefined>
) {
    const axisStartAngle = axes[ChartAxisDirection.X]?.scale.range[0] ?? 0;
    const fromFn = (_sect: _Scene.Sector, _datum: AnimatableSectorDatum, _status: _Scene.NodeUpdateState) => {
        return { startAngle: axisStartAngle, endAngle: axisStartAngle };
    };
    const toFn = (_sect: _Scene.Sector, datum: AnimatableSectorDatum, _status: _Scene.NodeUpdateState) => {
        return { startAngle: datum.startAngle, endAngle: datum.endAngle };
    };

    return { toFn, fromFn };
}

export function resetBarSelectionsFn(_node: _Scene.Sector, datum: AnimatableSectorDatum) {
    return {
        centerX: 0,
        centerY: 0,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
    };
}
