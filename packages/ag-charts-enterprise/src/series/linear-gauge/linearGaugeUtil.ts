import { type TextAlign, _ModuleSupport } from 'ag-charts-community';
import {
    BBox,
    type BoxBounds,
    type InternalAgGradientColor,
    type LinearScale,
    type NormalisedGaugeColorStop,
    type NormalisedGaugeSeriesStyle,
    type NormalisedLinearGaugeBarOptions,
    type NormalisedLinearGaugeDefaultTargetOptions,
    type NormalisedLinearGaugeScaleOptions,
    type NormalisedLinearGaugeTargetOptions,
    type NormalisedTextOrSegments,
    boxContains,
    cachedTextMeasurer,
    getColorStops,
    isArray,
    measureTextSegments,
    toNumberOrUndefined,
    toPlainText,
    toTextString,
} from 'ag-charts-core';
import type { Rect, Selection, Text } from 'ag-charts-core';
import type { AgGaugeFillMode, AgLinearGaugeLabelPlacement } from 'ag-charts-types';

import {
    type GaugeLabelCandidate,
    type GaugeLabelPlacements,
    type GaugePointLabelDatum,
    gaugeLabelDatum,
} from '../gauge-util/labelPlacement';
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

interface LinearGaugeLabelLayout {
    layout: LabelFormatting;
    x: number;
    y: number;
    align: Align;
    box: BBox;
    /** Span of the scale the placement keeps the label within, when it bounds the label at all. */
    region: BoxBounds | undefined;
}

type LinearGaugeLabelBBoxes = { seriesRect: BBox; gaugeRect: BBox; barRect: BBox };

interface LinearGaugeLabelOpts {
    padding: number;
    horizontal: boolean;
    barEnabled: boolean;
}

const LINEAR_GAUGE_LABEL_KEY = 'label';

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

/** The deprecated `avoidCollisions: false` keeps the label at its natural size wherever it lands. */
function isLegacyKeep(labelDatum: LinearGaugeLabelDatum) {
    return labelDatum.avoidCollisions === false && labelDatum.collision == null;
}

function layoutLinearGaugeLabel(
    labelText: NormalisedTextOrSegments,
    labelDatum: LinearGaugeLabelDatum,
    placement: AgLinearGaugeLabelPlacement,
    overflow: boolean,
    opts: LinearGaugeLabelOpts,
    bboxes: LinearGaugeLabelBBoxes
): LinearGaugeLabelLayout | undefined {
    const { gaugeRect } = bboxes;
    const { padding, horizontal } = opts;
    const legacyKeep = isLegacyKeep(labelDatum);
    const bounds = labelBounds(placement, horizontal, bboxes);
    const fitToGauge = bounds.inner && !legacyKeep;
    const boundingWidth = bounds.width ?? (fitToGauge ? gaugeRect.width : Infinity);
    const boundingHeight = bounds.height ?? (fitToGauge ? gaugeRect.height : Infinity);
    const { boxExtent } = labelDatum;
    const boxWidth = boxExtent.left + boxExtent.right;
    const boxHeight = boxExtent.top + boxExtent.bottom;
    const layout = measureLinearGaugeLabel(
        labelText,
        labelDatum,
        padding,
        boundingWidth - boxWidth,
        boundingHeight - boxHeight,
        overflow
    );
    if (layout == null) return;

    const s = bounds.anchor + bounds.direction * labelDatum.spacing * (horizontal ? 1 : -1);
    const width = layout.width + boxWidth;
    const height = layout.height + boxHeight;
    const box = horizontal
        ? new BBox(
              s + horizontalAlignFactors[bounds.align] * width,
              gaugeRect.y + (gaugeRect.height - height) / 2,
              width,
              height
          )
        : new BBox(
              gaugeRect.x + (gaugeRect.width - width) / 2,
              s + verticalAlignFactors[bounds.align] * height,
              width,
              height
          );

    const textX = box.x + boxExtent.left;
    const textY = box.y + boxExtent.top;
    const x = horizontal ? textX - horizontalAlignFactors[bounds.align] * layout.width : textX + layout.width / 2;
    const y = horizontal ? textY + layout.height / 2 : textY - verticalAlignFactors[bounds.align] * layout.height;

    let region: BoxBounds | undefined;
    const { bounds0, bounds1 } = bounds;
    if (!legacyKeep && Number.isFinite(bounds0) && Number.isFinite(bounds1)) {
        const min = Math.min(bounds0, bounds1);
        const extent = Math.abs(bounds1 - bounds0);
        region = horizontal
            ? { x: min, y: box.y, width: extent, height: box.height }
            : { x: box.x, y: min, width: box.width, height: extent };
    }

    return { layout, x, y, align: bounds.align, box, region };
}

function isOutsidePlacement(placement: AgLinearGaugeLabelPlacement) {
    return placement === 'outside-start' || placement === 'outside-end';
}

/** The placement to set room aside for beside the gauge: the first outside one reached before any placement fits. */
export function reservedLinearGaugeLabelPlacement(
    labelDatum: LinearGaugeLabelDatum,
    labelText: () => NormalisedTextOrSegments | undefined,
    opts: LinearGaugeLabelOpts,
    bboxes: LinearGaugeLabelBBoxes
): AgLinearGaugeLabelPlacement | undefined {
    const { placements } = labelDatum;
    const [first] = placements;
    if (isOutsidePlacement(first) || isLegacyKeep(labelDatum) || !placements.some(isOutsidePlacement)) {
        return first;
    }

    const text = labelText();
    if (text == null) {
        return first;
    }
    return placements.find((placement) => {
        if (isOutsidePlacement(placement)) {
            return true;
        }
        const fitted = layoutLinearGaugeLabel(text, labelDatum, placement, false, opts, bboxes);
        if (fitted == null) {
            return false;
        }
        const { box, region } = fitted;
        return region == null || boxContains(region, box.x, box.y, box.width, box.height);
    });
}

/**
 * Offers the label to the label manager at the final value. Each placement that fits is a candidate in
 * order; with `alwaysShow`, placements that only fit by overflowing follow them as fallbacks.
 */
export function linearGaugeLabelDatum(
    labelDatum: LinearGaugeLabelDatum,
    labelText: NormalisedTextOrSegments,
    opts: LinearGaugeLabelOpts,
    bboxes: LinearGaugeLabelBBoxes
): GaugePointLabelDatum | undefined {
    const { placements, collision } = labelDatum;
    const legacyKeep = isLegacyKeep(labelDatum);
    const candidates: GaugeLabelCandidate[] = [];
    const overflowing: GaugeLabelCandidate[] = [];
    const placementCount = legacyKeep ? 1 : placements.length;
    for (let index = 0; index < placementCount; index++) {
        const fitted = layoutLinearGaugeLabel(labelText, labelDatum, placements[index], false, opts, bboxes);
        if (fitted != null) {
            candidates.push({ id: index, box: fitted.box, region: fitted.region });
            continue;
        }
        const overflow = collision?.alwaysShow
            ? layoutLinearGaugeLabel(labelText, labelDatum, placements[index], true, opts, bboxes)
            : undefined;
        if (overflow != null) {
            overflowing.push({ id: placements.length + index, box: overflow.box, region: overflow.region });
        }
    }

    const { seriesRect } = bboxes;
    const seriesArea = { x: 0, y: 0, width: seriesRect.width, height: seriesRect.height };
    return gaugeLabelDatum(
        LINEAR_GAUGE_LABEL_KEY,
        labelText,
        candidates.concat(overflowing),
        collision,
        legacyKeep,
        seriesArea
    );
}

/** Lays the label out at the placement the label manager chose, at the current (possibly animated) value. */
export function formatLinearGaugeLabels(
    selection: Selection<LinearGaugeLabelDatum, Text<LinearGaugeLabelDatum>>,
    labelText: NormalisedTextOrSegments | undefined,
    opts: LinearGaugeLabelOpts,
    bboxes: LinearGaugeLabelBBoxes,
    placements: GaugeLabelPlacements
) {
    const { barRect } = bboxes;
    const { horizontal, barEnabled } = opts;
    const candidateId = placements.get(LINEAR_GAUGE_LABEL_KEY);

    const layoutPlaced = (labelDatum: LinearGaugeLabelDatum) => {
        if (candidateId == null || labelText == null) return;
        const { placements: labelPlacements } = labelDatum;
        const placement = labelPlacements[candidateId % labelPlacements.length];
        const overflow = candidateId >= labelPlacements.length;
        const layout = layoutLinearGaugeLabel(labelText, labelDatum, placement, overflow, opts, bboxes);
        if (layout != null || overflow) return layout;
        return layoutLinearGaugeLabel(labelText, labelDatum, placement, true, opts, bboxes);
    };

    selection.each((label, labelDatum) => {
        const placed = layoutPlaced(labelDatum);

        if (placed == null) {
            label.visible = false;
            return;
        }

        const { layout, x, y, align, box } = placed;
        const centre = box.computeCenter();
        const inside = barEnabled && barRect.containsPoint(centre.x, centre.y);

        label.visible = true;
        label.text = layout.text;
        label.fontSize = layout.fontSize;
        label.lineHeight = layout.lineHeight;
        const style = inside ? labelDatum.insideStyle : labelDatum.outsideStyle;
        label.fill = style.color;
        label.setBoxing(style);

        label.textAlign = horizontal ? horizontalTextAligns[align] : 'center';
        label.textBaseline = horizontal ? 'middle' : verticalTextBaselines[align];
        label.x = x;
        label.y = y;
    });
}
