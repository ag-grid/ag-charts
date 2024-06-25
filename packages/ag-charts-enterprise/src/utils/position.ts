import { type AgCartesianAxisPosition, _ModuleSupport, _Scene } from 'ag-charts-community';

const { ChartAxisDirection } = _ModuleSupport;

export function calculateAxisLabelPosition({
    x,
    y,
    labelBBox,
    bounds,
    axisPosition,
    axisDirection,
    padding,
}: {
    x: number;
    y: number;
    labelBBox: _Scene.BBox;
    bounds: _Scene.BBox;
    axisPosition?: AgCartesianAxisPosition;
    axisDirection: _ModuleSupport.ChartAxisDirection;
    padding: number;
}) {
    let coordinates: _Scene.Point;
    if (axisDirection === ChartAxisDirection.X) {
        const alignmentShift = 4;
        const xOffset = -labelBBox.width / 2;
        const yOffset = axisPosition === 'bottom' ? -alignmentShift : -labelBBox.height + alignmentShift;
        const fixedY = axisPosition === 'bottom' ? bounds.y + bounds.height + padding : bounds.y - padding;
        coordinates = {
            x: x + xOffset,
            y: fixedY + yOffset,
        };
    } else {
        const alignmentShift = 8;
        const yOffset = -labelBBox.height / 2;
        const xOffset = axisPosition === 'right' ? -alignmentShift : -labelBBox.width + alignmentShift;
        const fixedX = axisPosition === 'right' ? bounds.x + bounds.width + padding : bounds.x - padding;
        coordinates = {
            x: fixedX + xOffset,
            y: y + yOffset,
        };
    }

    return coordinates;
}

export function buildBounds(rect: _Scene.BBox, axisPosition: AgCartesianAxisPosition, padding: number): _Scene.BBox {
    const bounds = rect.clone();
    bounds.x += axisPosition === 'left' ? -padding : 0;
    bounds.y += axisPosition === 'top' ? -padding : 0;
    bounds.width += axisPosition === 'left' || axisPosition === 'right' ? padding : 0;
    bounds.height += axisPosition === 'top' || axisPosition === 'bottom' ? padding : 0;

    return bounds;
}
