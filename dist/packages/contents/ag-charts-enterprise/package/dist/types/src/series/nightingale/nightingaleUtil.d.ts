import { _Scene } from 'ag-charts-community';
export type AnimatableNightingaleDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};
export declare function prepareNightingaleAnimationFunctions(axisZeroRadius: number): {
    toFn: (_sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
    };
    fromFn: (sect: _Scene.Sector, datum: AnimatableNightingaleDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        startAngle: number;
        endAngle: number;
        phase: "end" | "initial" | "none" | "update" | "trailing" | "remove" | "add";
    };
};
export declare function resetNightingaleSelectionFn(_sect: _Scene.Sector, { innerRadius, outerRadius, startAngle, endAngle }: AnimatableNightingaleDatum): {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
};
