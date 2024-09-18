import { type TextAlign, type _ModuleSupport, _Scene } from 'ag-charts-community';

import { getLabelText } from '../gauge-util/label';
import { formatSingleLabel } from '../util/labelFormatter';
import type { LinearGaugeLabelDatum } from './linearGaugeSeriesProperties';

const { BBox } = _Scene;

export interface AnimatableRectDatum {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    clipX0: number | undefined;
    clipY0: number | undefined;
    clipX1: number | undefined;
    clipY1: number | undefined;
    horizontalInset: number;
    verticalInset: number;
}

type RectAnimationParams = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    clipX0: number | undefined;
    clipY0: number | undefined;
    clipX1: number | undefined;
    clipY1: number | undefined;
    horizontalInset: number;
    verticalInset: number;
};

function datumRect(datum: AnimatableRectDatum) {
    const { x0, y0, x1, y1, horizontalInset, verticalInset } = datum;

    const x = Math.min(x0, x1) + horizontalInset;
    const y = Math.min(y0, y1) + verticalInset;
    const width = Math.max(Math.abs(x1 - x0) - 2 * horizontalInset, 0);
    const height = Math.max(Math.abs(y1 - y0) - 2 * verticalInset, 0);

    return { x, y, width, height };
}

function clipBBoxVisibility(datum: AnimatableRectDatum, clipBBox: _Scene.BBox | undefined) {
    if (clipBBox == null) return true;

    const rect = datumRect(datum);
    const delta = 1e-6;
    const x0 = rect.x + delta;
    const y0 = rect.y + delta;
    const x1 = rect.x + rect.width - delta;
    const y1 = rect.y + rect.height - delta;
    const clipX0 = clipBBox.x;
    const clipX1 = clipBBox.x + clipBBox.width;
    const clipY0 = clipBBox.y;
    const clipY1 = clipBBox.y + clipBBox.height;

    return Math.max(x0, clipX0) <= Math.min(x1, clipX1) && Math.max(y0, clipY0) <= Math.min(y1, clipY1);
}

function hasClipBBox(datum: AnimatableRectDatum) {
    const { clipX0, clipX1, clipY0, clipY1 } = datum;
    return (clipX0 != null && clipX1 != null) || (clipY0 != null && clipY1 != null);
}

function computeClipBBox(datum: AnimatableRectDatum): _Scene.BBox | undefined {
    if (!hasClipBBox(datum)) return;

    const { x0, y0, x1, y1 } = datum;
    const { x, y, width, height } = datumRect(datum);
    let { clipX0, clipX1, clipY0, clipY1 } = datum;

    if (clipX0 == null || clipX1 == null) {
        clipX0 = x0;
        clipX1 = x1;
    }

    if (clipY0 == null || clipY1 == null) {
        clipY0 = y0;
        clipY1 = y1;
    }

    const clipX = Math.min(clipX0, clipX1);
    const clipY = Math.min(clipY0, clipY1);
    const clipWidth = Math.abs(clipX1 - clipX0);
    const clipHeight = Math.abs(clipY1 - clipY0);

    clipX0 = Math.max(x, clipX);
    clipY0 = Math.max(y, clipY);
    clipX1 = Math.min(x + width, clipX + clipWidth);
    clipY1 = Math.min(y + height, clipY + clipHeight);

    return new BBox(
        Math.min(clipX0, clipX1),
        Math.min(clipY0, clipY1),
        Math.abs(clipX1 - clipX0),
        Math.abs(clipY1 - clipY0)
    );
}

export function prepareLinearGaugeSeriesAnimationFunctions(initialLoad: boolean, horizontal: boolean) {
    const phase = initialLoad ? 'initial' : 'update';

    const node: _ModuleSupport.FromToFns<_Scene.Rect, RectAnimationParams, AnimatableRectDatum> = {
        fromFn(sect, datum) {
            const previousDatum: AnimatableRectDatum | undefined = sect.previousDatum;
            let { x0, y0, x1, y1, clipX0, clipY0, clipX1, clipY1 } = previousDatum ?? datum;
            const { horizontalInset, verticalInset } = datum;

            const previousHadClipBBox = previousDatum != null && hasClipBBox(previousDatum);
            const nextHasClipBBox = hasClipBBox(datum);

            if (previousHadClipBBox && nextHasClipBBox) {
                // Clip sector updated
                // Use previous clip data
            } else if (!previousHadClipBBox && nextHasClipBBox) {
                // Clip sector added
                ({ x0, y0, x1, y1, clipX0, clipY0, clipX1, clipY1 } = datum);

                if (initialLoad) {
                    if (horizontal) {
                        clipX1 = datum.clipX0;
                    } else {
                        clipY1 = datum.clipY0;
                    }
                }
            } else if (previousHadClipBBox && !nextHasClipBBox) {
                // Clip sector removed
                ({ x0, y0, x1, y1 } = datum);
                clipX0 = undefined;
                clipY0 = undefined;
                clipX1 = undefined;
                clipY1 = undefined;
            } else if (initialLoad) {
                // No clip sector - initial load
                if (horizontal) {
                    x1 = x0;
                } else {
                    y1 = y0;
                }
            }

            return { x0, y0, x1, y1, clipX0, clipY0, clipX1, clipY1, horizontalInset, verticalInset, phase };
        },
        toFn(_sect, datum) {
            const { x0, y0, x1, y1, clipX0, clipY0, clipX1, clipY1, horizontalInset, verticalInset } = datum;

            return { x0, y0, x1, y1, clipX0, clipY0, clipX1, clipY1, horizontalInset, verticalInset };
        },
        applyFn(rect, params) {
            rect.setProperties(resetLinearGaugeSeriesResetRectFunction(rect, params));
        },
    };

    return { node };
}

export function resetLinearGaugeSeriesResetRectFunction(_node: _Scene.Rect, datum: AnimatableRectDatum) {
    const { x, y, width, height } = datumRect(datum);
    const clipBBox = computeClipBBox(datum);
    const visible = clipBBoxVisibility(datum, clipBBox);
    return { x, y, width, height, clipBBox, visible };
}

enum Align {
    Before = 'Before',
    After = 'After',
    Center = 'Center',
}

const horizontalTextAligns: Record<Align, TextAlign> = {
    [Align.Before]: 'right',
    [Align.Center]: 'center',
    [Align.After]: 'left',
};

const verticalTextBaselines: Record<Align, CanvasTextBaseline> = {
    [Align.Before]: 'top',
    [Align.Center]: 'middle',
    [Align.After]: 'bottom',
};

const horizontalAlignFactors: Record<Align, number> = {
    [Align.Before]: -1,
    [Align.Center]: -0.5,
    [Align.After]: 0,
};

const verticalAlignFactors: Record<Align, number> = {
    [Align.Before]: 0,
    [Align.Center]: -0.5,
    [Align.After]: -1,
};

export function formatLinearGaugeLabels(
    series: _ModuleSupport.Series<any, any>,
    selection: _Scene.Selection<_Scene.Text, LinearGaugeLabelDatum>,
    opts: { padding: number; horizontal: boolean },
    bboxes: { scale: _Scene.BBox; bar: _Scene.BBox },
    datumOverrides?: { label: number | undefined }
) {
    const { scale, bar } = bboxes;
    const { padding, horizontal } = opts;

    selection.each((label, labelDatum) => {
        const labelText = getLabelText(series, labelDatum, datumOverrides?.label);

        const sizeFittingHeight = () => ({
            width: scale.width,
            height: scale.height,
            meta: null,
        });

        const labelMeta =
            labelText != null ? formatSingleLabel(labelText, labelDatum, { padding }, sizeFittingHeight) : undefined;
        const layout = labelMeta?.[0];

        if (layout == null) {
            label.visible = false;
            return;
        }

        const scale0 = horizontal ? scale.x : scale.y + scale.height;
        const scale1 = horizontal ? scale.x + scale.width : scale.y;
        const bar0 = horizontal ? bar.x : bar.y + bar.height;
        const bar1 = horizontal ? bar.x + bar.width : bar.y;

        const offset = labelDatum.spacing * (horizontal ? 1 : -1);

        let bounds0: number;
        let bounds1: number;
        let s: number;
        let align: Align;
        switch (labelDatum.placement) {
            case 'outside-start':
                bounds0 = -Infinity;
                bounds1 = Infinity;
                s = scale0 - offset;
                align = Align.Before;
                break;
            case 'outside-end':
                bounds0 = -Infinity;
                bounds1 = Infinity;
                s = scale1 + offset;
                align = Align.After;
                break;
            case 'inside-start':
                bounds0 = scale0;
                bounds1 = bar1;
                s = scale0 + offset;
                align = Align.After;
                break;
            case 'inside-end':
                bounds0 = bar1;
                bounds1 = scale1;
                s = scale1 - offset;
                align = Align.Before;
                break;
            case 'inside':
                bounds0 = scale0;
                bounds1 = scale1;
                s = (scale0 + scale1) / 2;
                align = Align.Center;
                break;
            case 'bar-inside':
                bounds0 = bar0;
                bounds1 = bar1;
                s = (bar0 + bar1) / 2;
                align = Align.Center;
                break;
            case 'bar-inside-end':
                bounds0 = bar0;
                bounds1 = bar1;
                s = bar1 - offset;
                align = Align.Before;
                break;
            case 'bar-outside-end':
                bounds0 = bar1;
                bounds1 = scale1;
                s = bar1 + offset;
                align = Align.After;
                break;
            case 'bar-end':
                bounds0 = -Infinity;
                bounds1 = Infinity;
                s = bar1;
                align = Align.Center;
                break;
        }

        const x = horizontal ? s : scale.x + scale.width / 2;
        const y = horizontal ? scale.y + scale.height / 2 : s;

        let s0: number;
        let s1: number;
        if (horizontal) {
            s0 = x + horizontalAlignFactors[align] * layout.width;
            s1 = s0 + layout.width;
        } else {
            s0 = y + verticalAlignFactors[align] * layout.height;
            s1 = s0 + layout.height;
        }

        const inside = Math.min(s0, s1) >= Math.min(bounds0, bounds1) && Math.max(s0, s1) <= Math.max(bounds0, bounds1);
        if (labelDatum.avoidCollisions && !inside) {
            label.visible = false;
            return;
        }

        label.visible = true;
        label.text = layout.text;
        label.fontSize = layout.fontSize;
        label.lineHeight = layout.lineHeight;

        label.textAlign = horizontal ? horizontalTextAligns[align] : 'center';
        label.textBaseline = horizontal ? 'middle' : verticalTextBaselines[align];
        label.x = x;
        label.y = y;
    });
}
