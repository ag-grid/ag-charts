import type { _Scene } from 'ag-charts-community';

type SectorLike = { innerRadius: number; outerRadius: number };
type AnimatableRadialColumnDatum = { innerRadius: number; outerRadius: number };
export function prepareRadialColumnAnimationFunctions(axisInnerRadius: number) {
    const fromFn = (_sect: SectorLike, _datum: AnimatableRadialColumnDatum, _status: _Scene.NodeUpdateState) => {
        return { innerRadius: axisInnerRadius, outerRadius: axisInnerRadius };
    };
    const toFn = (_sect: SectorLike, datum: AnimatableRadialColumnDatum, _status: _Scene.NodeUpdateState) => {
        return {
            innerRadius: datum.innerRadius,
            outerRadius: datum.outerRadius,
        };
    };

    return { toFn, fromFn };
}

export function resetRadialColumnSelectionFn(
    _sect: SectorLike,
    { innerRadius, outerRadius }: AnimatableRadialColumnDatum
) {
    return { innerRadius, outerRadius };
}
