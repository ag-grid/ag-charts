import { _ModuleSupport, _Scene } from 'ag-charts-community';
type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};
export declare function prepareRadialBarSeriesAnimationFunctions(axes: Record<_ModuleSupport.ChartAxisDirection, _ModuleSupport.ChartAxis | undefined>): {
    toFn: (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
    };
    fromFn: (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        animationDuration: number;
        animationDelay: number;
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
    };
};
export declare function resetRadialBarSelectionsFn(_node: _Scene.Sector, datum: AnimatableSectorDatum): {
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};
export {};
