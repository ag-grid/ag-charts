import { type TextAlign, _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    type InternalAgGradientColor,
    type LinearScale,
    type NormalisedGaugeColorStop,
    type NormalisedGaugeSeriesStyle,
    type NormalisedLinearGaugeBarOptions,
    type NormalisedLinearGaugeDefaultTargetOptions,
    type NormalisedLinearGaugeScaleOptions,
    type NormalisedLinearGaugeTargetOptions,
    type NormalisedTextOrSegments,
    cachedTextMeasurer,
    getColorStops,
    isArray,
    measureTextSegments,
    toNumberOrUndefined,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { Rect, Selection, Text } from 'ag-charts-core';
import type { AgGaugeFillMode, AgLinearGaugeLabelPlacement, AgNumericValue } from 'ag-charts-types';

import { getLabelText } from '../gauge-util/label';
import { collidesWithAny } from '../gauge-util/labelCollision';
import { type LabelFormatting, formatSingleLabel } from '../util/labelFormatter';
import type { LinearGaugeLabelDatum } from './linearGaugeTypes';

export function createLinearGradient(
    fills: NormalisedGaugeColorStop[] | undefined,
    fillMode: AgGaugeFillMode,
    defaultColorRange: string[],
    scale: LinearScale,
    horizontal: boolean
): InternalAgGradientColor {
    // Colour-stop positions are fractional thresholds, so Number is exact enough here.
    const stops = fills?.map(({ color, stop }) => ({ color, stop: toNumberOrUndefined(stop) })) ?? [];
    const colorStops = getColorStops(stops, defaultColorRange, scale.domain.map(Number), fillMode);
    return {
        type: 'gradient',
        gradient: 'linear',
        colorSpace: 'oklch',
        colorStops,
        rotation: horizontal ? 90 : 0,
        bounds: 'series',
    };
}

export function getLinearGaugeBarStyle(
    bar: NormalisedLinearGaugeBarOptions,
    defaultColorRange: string[],
    horizontal: boolean,
    scale: LinearScale
): Required<NormalisedGaugeSeriesStyle> {
    const { fill, fills, fillMode, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset } = bar;
    const barFill = fill ?? createLinearGradient(fills, fillMode, defaultColorRange, scale, horizontal);
    return { fill: barFill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

export function getLinearGaugeScaleStyle(
    scaleOptions: NormalisedLinearGaugeScaleOptions,
    barEnabled: boolean,
    defaultColorRange: string[],
    horizontal: boolean,
    scale: LinearScale
): Required<NormalisedGaugeSeriesStyle> {
    const {
        fill,
        fills,
        defaultFill,
        fillMode,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
    } = scaleOptions;
    const scaleFill =
        fill ??
        (barEnabled && (fills == null || fills.length === 0) ? defaultFill : undefined) ??
        createLinearGradient(fills, fillMode, defaultColorRange, scale, horizontal);
    return { fill: scaleFill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

export function getLinearGaugeTargetStyle(
    target: NormalisedLinearGaugeTargetOptions,
    defaultTarget: NormalisedLinearGaugeDefaultTargetOptions
): Required<NormalisedGaugeSeriesStyle> {
    const {
        fill = defaultTarget.fill,
        fillOpacity = defaultTarget.fillOpacity,
        stroke = defaultTarget.stroke,
        strokeWidth = defaultTarget.strokeWidth,
        strokeOpacity = defaultTarget.strokeOpacity,
        lineDash = defaultTarget.lineDash,
        lineDashOffset = defaultTarget.lineDashOffset,
    } = target;
    return { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

interface AnimatableRectDatum {
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

interface Ctx {
    chartService: { context?: unknown };
}

function datumRect(datum: AnimatableRectDatum) {
    const { x0, y0, x1, y1, horizontalInset, verticalInset } = datum;

    const x = Math.min(x0, x1) + horizontalInset;
    const y = Math.min(y0, y1) + verticalInset;
    const width = Math.max(Math.abs(x1 - x0) - 2 * horizontalInset, 0);
    const height = Math.max(Math.abs(y1 - y0) - 2 * verticalInset, 0);

    return { x, y, width, height };
}

function clipBBoxVisibility(datum: AnimatableRectDatum, clipBBox: BBox | undefined) {
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

function computeClipBBox(datum: AnimatableRectDatum): BBox | undefined {
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
    type D = RectAnimationParams;
    type N = Rect<D>;
    type T = AnimatableRectDatum & Record<string, string | number | undefined>;

    const phase = initialLoad ? 'initial' : 'update';

    const node: _ModuleSupport.FromToFns<D, N, T> = {
        fromFn(sect, datum): T & Pick<_ModuleSupport.ExtraOpts<never>, 'phase'> {
            const previousDatum: D | undefined = sect.previousDatum;
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

export function resetLinearGaugeSeriesResetRectFunction(_node: Rect, datum: AnimatableRectDatum) {
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

interface LinearGaugeLabelCandidate {
    layout: LabelFormatting;
    x: number;
    y: number;
    align: Align;
    box: BBox;
    overflow: number;
    blocked: boolean;
    clipped: boolean;
}

type LinearGaugeLabelBBoxes = { seriesRect: BBox; gaugeRect: BBox; barRect: BBox };

interface LinearGaugeLabelBounds {
    width?: number;
    height?: number;
    bounds0: number;
    bounds1: number;
    anchor: number;
    align: Align;
    direction: -1 | 0 | 1;
    inner: boolean;
}

function labelBounds(
    placement: AgLinearGaugeLabelPlacement,
    horizontal: boolean,
    bboxes: LinearGaugeLabelBBoxes
): LinearGaugeLabelBounds {
    const { seriesRect, gaugeRect, barRect } = bboxes;
    const scale0 = horizontal ? gaugeRect.x : gaugeRect.y + gaugeRect.height;
    const scale1 = horizontal ? gaugeRect.x + gaugeRect.width : gaugeRect.y;
    const bar0 = horizontal ? barRect.x : barRect.y + barRect.height;
    const bar1 = horizontal ? barRect.x + barRect.width : barRect.y;

    switch (placement) {
        case 'outside-start':
            return {
                width: horizontal ? gaugeRect.x : seriesRect.width,
                height: horizontal ? seriesRect.height : seriesRect.height - (gaugeRect.y + gaugeRect.height),
                bounds0: -Infinity,
                bounds1: Infinity,
                anchor: scale0,
                align: Align.Before,
                direction: -1,
                inner: false,
            };
        case 'outside-end':
            return {
                width: horizontal ? seriesRect.width - (gaugeRect.x + gaugeRect.width) : seriesRect.width,
                height: horizontal ? seriesRect.height : gaugeRect.y,
                bounds0: -Infinity,
                bounds1: Infinity,
                anchor: scale1,
                align: Align.After,
                direction: 1,
                inner: false,
            };
        case 'inside-start':
            return { bounds0: scale0, bounds1: bar1, anchor: scale0, align: Align.After, direction: 1, inner: true };
        case 'inside-end':
            return { bounds0: bar1, bounds1: scale1, anchor: scale1, align: Align.Before, direction: -1, inner: true };
        case 'inside-center':
            return {
                bounds0: scale0,
                bounds1: scale1,
                anchor: (scale0 + scale1) / 2,
                align: Align.Center,
                direction: 0,
                inner: true,
            };
        case 'bar-inside':
            return {
                bounds0: bar0,
                bounds1: bar1,
                anchor: (bar0 + bar1) / 2,
                align: Align.Center,
                direction: 0,
                inner: true,
            };
        case 'bar-inside-end':
            return { bounds0: bar0, bounds1: bar1, anchor: bar1, align: Align.Before, direction: -1, inner: true };
        case 'bar-outside-end':
            return { bounds0: bar1, bounds1: scale1, anchor: bar1, align: Align.After, direction: 1, inner: true };
        case 'bar-end':
            return {
                bounds0: -Infinity,
                bounds1: Infinity,
                anchor: bar1,
                align: Align.Center,
                direction: 0,
                inner: true,
            };
    }
}

function measureLinearGaugeLabel(
    labelText: NormalisedTextOrSegments,
    labelDatum: LinearGaugeLabelDatum,
    padding: number,
    boundingWidth: number,
    boundingHeight: number,
    alwaysShow: boolean
): LabelFormatting | undefined {
    const { maxWidth, maxHeight } = labelDatum;
    if (Number.isFinite(boundingWidth) || Number.isFinite(boundingHeight) || maxWidth != null || maxHeight != null) {
        const props = alwaysShow ? labelDatum : { ...labelDatum, collision: undefined };
        const sizeFittingHeight = () => ({ width: boundingWidth, height: boundingHeight, meta: null });
        return formatSingleLabel(toPlainText(labelText), props, { padding }, sizeFittingHeight)?.[0];
    }

    const measurer = cachedTextMeasurer(labelDatum);
    const lineHeight = labelDatum.lineHeight ?? measurer.lineHeight();
    let width: number;
    let height: number;
    if (isArray(labelText)) {
        ({ width, height } = measureTextSegments(labelText, labelDatum));
    } else {
        const { width: textWidth, lineMetrics } = measurer.measureLines(toTextString(labelText));
        width = textWidth;
        height = lineMetrics.length * lineHeight;
    }
    return { text: labelText, fontSize: labelDatum.fontSize, lineHeight, width, height };
}

export function formatLinearGaugeLabels(
    series: { id: string },
    ctx: Ctx,
    selection: Selection<LinearGaugeLabelDatum, Text<LinearGaugeLabelDatum>>,
    opts: { padding: number; horizontal: boolean; barEnabled: boolean },
    bboxes: LinearGaugeLabelBBoxes,
    obstacles: readonly BBox[],
    datumOverrides?: { label: AgNumericValue | undefined }
) {
    const { seriesRect, gaugeRect, barRect } = bboxes;
    const { padding, horizontal, barEnabled } = opts;

    selection.each((label, labelDatum) => {
        const labelText = getLabelText(series.id, ctx, labelDatum, datumOverrides?.label);
        if (labelText == null) return;

        const { placements, collision } = labelDatum;
        // The deprecated `avoidCollisions: false` keeps the label at its natural size wherever it lands.
        const legacyKeep = labelDatum.avoidCollisions === false && collision == null;
        const avoidObstacles = collision != null && obstacles.length > 0;

        const layoutCandidate = (
            placement: AgLinearGaugeLabelPlacement,
            alwaysShow: boolean
        ): LinearGaugeLabelCandidate | undefined => {
            const bounds = labelBounds(placement, horizontal, bboxes);
            const fitToGauge = bounds.inner && !legacyKeep;
            const boundingWidth = bounds.width ?? (fitToGauge ? gaugeRect.width : Infinity);
            const boundingHeight = bounds.height ?? (fitToGauge ? gaugeRect.height : Infinity);
            const layout = measureLinearGaugeLabel(
                labelText,
                labelDatum,
                padding,
                boundingWidth,
                boundingHeight,
                alwaysShow
            );
            if (layout == null) return;

            const s = bounds.anchor + bounds.direction * labelDatum.spacing * (horizontal ? 1 : -1);
            const x = horizontal ? s : gaugeRect.x + gaugeRect.width / 2;
            const y = horizontal ? gaugeRect.y + gaugeRect.height / 2 : s;

            let s0: number;
            let box: BBox;
            if (horizontal) {
                s0 = x + horizontalAlignFactors[bounds.align] * layout.width;
                box = new BBox(s0, y - layout.height / 2, layout.width, layout.height);
            } else {
                s0 = y + verticalAlignFactors[bounds.align] * layout.height;
                box = new BBox(x - layout.width / 2, s0, layout.width, layout.height);
            }
            const s1 = s0 + (horizontal ? layout.width : layout.height);

            const min = Math.min(bounds.bounds0, bounds.bounds1);
            const max = Math.max(bounds.bounds0, bounds.bounds1);
            const overflow = Math.max(0, min - s0) + Math.max(0, s1 - max);
            const blocked = avoidObstacles && collidesWithAny(box, obstacles, collision.threshold);

            const clipped =
                box.x < 0 ||
                box.y < 0 ||
                box.x + box.width > seriesRect.width ||
                box.y + box.height > seriesRect.height;

            return { layout, x, y, align: bounds.align, box, overflow, blocked, clipped };
        };

        let chosen: LinearGaugeLabelCandidate | undefined;
        if (legacyKeep) {
            chosen = layoutCandidate(placements[0], false);
        } else {
            for (const placement of placements) {
                const candidate = layoutCandidate(placement, false);
                if (candidate?.overflow === 0 && !candidate.blocked) {
                    chosen = candidate;
                    break;
                }
            }
        }

        if (chosen == null && collision?.alwaysShow) {
            for (const placement of placements) {
                const candidate = layoutCandidate(placement, true);
                if (candidate != null && isBetterFallback(candidate, chosen)) {
                    chosen = candidate;
                }
            }
        }

        if (chosen == null) {
            label.visible = false;
            return;
        }

        const { layout, x, y, align, box } = chosen;
        const centre = box.computeCenter();
        const inside = barEnabled && barRect.containsPoint(centre.x, centre.y);

        label.visible = true;
        label.text = layout.text;
        label.fontSize = layout.fontSize;
        label.lineHeight = layout.lineHeight;
        label.fill = (inside ? labelDatum.insideFill : labelDatum.outsideFill) ?? labelDatum.fill;

        label.textAlign = horizontal ? horizontalTextAligns[align] : 'center';
        label.textBaseline = horizontal ? 'middle' : verticalTextBaselines[align];
        label.x = x;
        label.y = y;
    });
}

function isBetterFallback(candidate: LinearGaugeLabelCandidate, current: LinearGaugeLabelCandidate | undefined) {
    if (current == null) return true;
    if (candidate.blocked !== current.blocked) return !candidate.blocked;
    if (candidate.clipped !== current.clipped) return !candidate.clipped;
    return candidate.overflow < current.overflow;
}
