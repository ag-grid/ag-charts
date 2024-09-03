import type { AgAnnotationLineStyleType, PixelSize, _Scene } from 'ag-charts-community';

export function getLineStyle(lineDash?: PixelSize[], lineStyle?: AgAnnotationLineStyleType) {
    return lineDash ? 'dashed' : lineStyle ?? 'solid';
}

export function getComputedLineDash(strokeWidth: number, styleType: AgAnnotationLineStyleType): PixelSize[] {
    switch (styleType) {
        case 'solid':
            return [];
        case 'dashed':
            return [strokeWidth * 4, strokeWidth * 2];
        case 'dotted':
            return [0, strokeWidth * 2];
    }
}

export function getLineDash(
    lineDash?: PixelSize[],
    computedLineDash?: PixelSize[],
    lineStyle?: AgAnnotationLineStyleType,
    strokeWidth?: number
): PixelSize[] | undefined {
    const styleType = getLineStyle(lineDash, lineStyle);
    return computedLineDash ?? lineDash ?? getComputedLineDash(strokeWidth ?? 1, styleType);
}

export function getLineCap(
    lineCap?: _Scene.ShapeLineCap,
    lineDash?: PixelSize[],
    lineStyle?: AgAnnotationLineStyleType
): _Scene.ShapeLineCap | undefined {
    const styleType = getLineStyle(lineDash, lineStyle);
    return lineCap ?? styleType === 'dotted' ? 'round' : undefined;
}
