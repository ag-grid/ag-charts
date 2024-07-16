import { _Scene } from 'ag-charts-community';
type AnimatableSectorDatum = {
    angleValue: any;
    radiusValue: any;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _Scene.SectorBox;
};
export declare function prepareRadialBarSeriesAnimationFunctions(axisZeroAngle: number): {
    toFn: (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
        clipSector: _Scene.SectorBox;
    };
    fromFn: (sect: _Scene.Sector, datum: AnimatableSectorDatum, status: _Scene.NodeUpdateState) => {
        startAngle: number;
        endAngle: number;
        innerRadius: number;
        outerRadius: number;
        clipSector: _Scene.SectorBox;
        phase: "end" | "initial" | "none" | "update" | "trailing" | "remove" | "add";
    };
};
export declare function resetRadialBarSelectionsFn(_node: _Scene.Sector, datum: AnimatableSectorDatum): {
    centerX: number;
    centerY: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _Scene.SectorBox;
};
export {};
