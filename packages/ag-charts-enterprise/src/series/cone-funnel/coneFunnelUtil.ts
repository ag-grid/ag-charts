import type { _Scene } from 'ag-charts-community';

type AnimatableBarDatum = {
    x: number;
    y: number;
    height: number;
    width: number;
    opacity?: number;
};

export function resetLineSelectionsFn(_node: _Scene.Line, { x, y, width, height, opacity }: AnimatableBarDatum) {
    return { x1: x, y1: y, x2: x + width, y2: y + height, opacity };
}
