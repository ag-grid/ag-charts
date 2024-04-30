import { _Scene } from 'ag-charts-community';
import type { RadialColumnNodeDatum } from '../radial-column/radialColumnSeriesBase';
export type AnimatableNightingaleDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _Scene.SectorBox;
};
export declare function getRadii(datum: RadialColumnNodeDatum): {
    innerRadius: number;
    outerRadius: number;
    clipInnerRadius: number;
    clipOuterRadius: number;
};
export declare function prepareNightingaleAnimationFunctions(axisZeroRadius: number): {
    toFn: (_sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        clipSector: _Scene.SectorBox;
    };
    fromFn: (sect: _Scene.Sector, datum: RadialColumnNodeDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        clipSector: _Scene.SectorBox;
        phase: "end" | "initial" | "none" | "update" | "trailing" | "remove" | "add";
    };
};
export declare function resetNightingaleSelectionFn(_sect: _Scene.Sector, datum: RadialColumnNodeDatum): {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipSector: _Scene.SectorBox;
};
