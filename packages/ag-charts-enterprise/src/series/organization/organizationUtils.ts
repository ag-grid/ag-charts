import { type CssColor, type FillOptions, type StrokeOptions, _ModuleSupport } from 'ag-charts-community';
import type { FontOptions } from 'ag-charts-core';

export function applyFillStyles(node: _ModuleSupport.Shape, styles: FillOptions) {
    node.fill = styles.fill;
    node.fillOpacity = styles.fillOpacity ?? 1;
}

export function applyStrokeStyles(
    node: _ModuleSupport.Shape,
    styles: StrokeOptions & { lineDash?: number[]; lineDashOffset?: number }
) {
    node.lineDash = styles.lineDash;
    node.lineDashOffset = styles.lineDashOffset ?? 0;
    node.stroke = styles.stroke;
    node.strokeOpacity = styles.strokeOpacity ?? 1;
    node.strokeWidth = styles.strokeWidth ?? 0;
}

export function applyTextStyles(node: _ModuleSupport.Text, styles: FontOptions & { color: CssColor }) {
    node.fill = styles.color;
    node.fontFamily = styles.fontFamily;
    node.fontSize = styles.fontSize;
    node.fontStyle = styles.fontStyle;
    node.fontWeight = styles.fontWeight;
    node.textAlign = 'left';
    node.textBaseline = 'top';
}
