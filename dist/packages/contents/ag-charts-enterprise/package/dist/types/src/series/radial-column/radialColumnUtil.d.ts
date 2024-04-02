import { _Scene } from 'ag-charts-community';
export type AnimatableRadialColumnDatum = {
    innerRadius: number;
    outerRadius: number;
    columnWidth: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    startAngle: number;
    endAngle: number;
};
type AngleKey = 'startAngle' | 'endAngle';
type AngleObject = Record<AngleKey, number>;
export declare function createAngleMotionCalculator(): {
    calculate: (node: _Scene.Path & AngleObject, datum: AngleObject, status: _Scene.NodeUpdateState) => void;
    from: (datum: AngleObject) => {
        startAngle: number;
        endAngle: number;
    };
    to: (datum: AngleObject) => {
        startAngle: number;
        endAngle: number;
    };
};
export declare function fixRadialColumnAnimationStatus(node: _Scene.Path, datum: {
    startAngle: number;
    endAngle: number;
}, status: _Scene.NodeUpdateState): _Scene.NodeUpdateState;
export declare function prepareRadialColumnAnimationFunctions(axisZeroRadius: number): {
    toFn: (node: _Scene.RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        columnWidth: number;
        axisInnerRadius: number;
        axisOuterRadius: number;
        startAngle: number;
        endAngle: number;
    };
    fromFn: (node: _Scene.RadialColumnShape, datum: AnimatableRadialColumnDatum, status: _Scene.NodeUpdateState) => {
        innerRadius: number;
        outerRadius: number;
        columnWidth: number;
        axisInnerRadius: number;
        axisOuterRadius: number;
        startAngle: number;
        endAngle: number;
        phase: "end" | "initial" | "none" | "update" | "trailing" | "remove" | "add";
    };
};
export declare function resetRadialColumnSelectionFn(_node: _Scene.RadialColumnShape, { innerRadius, outerRadius, columnWidth, axisInnerRadius, axisOuterRadius, startAngle, endAngle, }: AnimatableRadialColumnDatum): {
    innerRadius: number;
    outerRadius: number;
    columnWidth: number;
    axisInnerRadius: number;
    axisOuterRadius: number;
    startAngle: number;
    endAngle: number;
};
export {};
