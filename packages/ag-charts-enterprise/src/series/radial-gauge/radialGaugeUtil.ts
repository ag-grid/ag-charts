import { type TextAlign, type VerticalAlign, _ModuleSupport } from 'ag-charts-community';
import {
    type GradientColorStop,
    type InternalAgGradientColor,
    type LinearScale,
    type NormalisedGaugeColorStop,
    type NormalisedGaugeSeriesStyle,
    type NormalisedRadialGaugeBarOptions,
    type NormalisedRadialGaugeScaleOptions,
    type NormalisedRadialGaugeTargetOptions,
    type NormalisedTextOrSegments,
    SectorBox,
    Text,
    getColorStops,
    normalizeAngle360,
    normalizeAngle360Inclusive,
    toDegrees,
    toNumberOrUndefined,
    toPlainText,
} from 'ag-charts-core';
import type { BoxBounds, Sector, Selection } from 'ag-charts-core';
import type { AgGaugeFillMode, AgNumericValue } from 'ag-charts-types';

import { getLabelText } from '../gauge-util/label';
import { type GaugeLabelPlacements, type GaugePointLabelDatum, gaugeLabelDatum } from '../gauge-util/labelPlacement';
import { type LabelFormatting, formatSingleLabel, formatStackedLabels } from '../util/labelFormatter';
import type { RadialGaugeNeedle } from './radialGaugeNeedle';
import { LabelType, type RadialGaugeLabelDatum } from './radialGaugeTypes';

export function createConicGradient(
    fills: NormalisedGaugeColorStop[] | undefined,
    fillMode: AgGaugeFillMode,
    defaultColorRange: string[],
    scale: LinearScale
): InternalAgGradientColor {
    const { domain, range } = scale;
    const [startAngle, endAngle] = range;

    const conicAngle = normalizeAngle360((startAngle + endAngle) / 2 + Math.PI);
    const sweepAngle = normalizeAngle360Inclusive(endAngle - startAngle);

    // Colour-stop positions are fractional thresholds, so Number is exact enough here.
    const stops = fills?.map(({ color, stop }) => ({ color, stop: toNumberOrUndefined(stop) })) ?? [];
    const colorStops = getColorStops(stops, defaultColorRange, domain.map(Number), fillMode).map(
        ({ color, stop }): GradientColorStop => {
            stop = Math.min(Math.max(stop, 0), 1);
            const angle = startAngle + sweepAngle * stop;
            stop = (angle - conicAngle) / (2 * Math.PI);
            stop = ((stop % 1) + 1) % 1;
            return { stop, color };
        }
    );

    return {
        type: 'gradient',
        gradient: 'conic',
        colorSpace: 'oklch',
        colorStops,
        bounds: 'series',
        rotation: toDegrees(conicAngle) + 90,
    };
}

export function getRadialGaugeBarStyle(
    bar: NormalisedRadialGaugeBarOptions,
    defaultColorRange: string[],
    scale: LinearScale
): Required<NormalisedGaugeSeriesStyle> {
    const {
        enabled,
        fill,
        fills,
        fillMode,
        fillOpacity,
        stroke,
        strokeWidth,
        strokeOpacity,
        lineDash,
        lineDashOffset,
    } = bar;
    const barFill = enabled ? (fill ?? createConicGradient(fills, fillMode, defaultColorRange, scale)) : 'none';
    return { fill: barFill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

export function getRadialGaugeScaleStyle(
    scaleOptions: NormalisedRadialGaugeScaleOptions,
    barEnabled: boolean,
    defaultColorRange: string[],
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
        createConicGradient(fills, fillMode, defaultColorRange, scale);
    return { fill: scaleFill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

/** Radial targets never inherit style from the themed default target, so unset keys fall back to a plain black marker. */
export function getRadialGaugeTargetStyle(
    target: NormalisedRadialGaugeTargetOptions
): Required<NormalisedGaugeSeriesStyle> {
    const {
        fill = 'black',
        fillOpacity = 1,
        stroke = 'black',
        strokeWidth = 0,
        strokeOpacity = 1,
        lineDash = [0],
        lineDashOffset = 0,
    } = target;
    return { fill, fillOpacity, stroke, strokeWidth, strokeOpacity, lineDash, lineDashOffset };
}

type AnimatableSectorDatum = {
    itemId: string;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle?: number;
    clipEndAngle?: number;
};

interface DefinedClipSector {
    clipStartAngle: number;
    clipEndAngle: number;
}

type SectorAnimation = {
    startAngle: number;
    endAngle: number;
    clipSector: SectorBox | undefined;
};

type AnimatableNeedleDatum = {
    radius: number;
    angle: number;
};

type NeedleAnimation = {
    rotation: number;
};

interface Ctx {
    chartService: { context?: unknown };
}

function computeClipSector(datum: AnimatableSectorDatum) {
    const { startAngle, endAngle, clipStartAngle, clipEndAngle, innerRadius, outerRadius } = datum;

    if (clipStartAngle == null || clipEndAngle == null) return;

    return new SectorBox(
        Math.max(clipStartAngle, startAngle),
        Math.min(clipEndAngle, endAngle),
        innerRadius,
        outerRadius
    );
}

function clipSectorVisibility(startAngle: number, endAngle: number, clipSector: SectorBox) {
    return Math.max(startAngle, clipSector.startAngle) <= Math.min(endAngle, clipSector.endAngle);
}

function hasClipSector(datum: AnimatableSectorDatum): datum is AnimatableSectorDatum & DefinedClipSector {
    return datum.clipStartAngle != null && datum.clipEndAngle != null;
}

function datumClipSector(datum: AnimatableSectorDatum & DefinedClipSector, zero: boolean) {
    const { clipStartAngle, clipEndAngle, innerRadius, outerRadius } = datum;

    return new SectorBox(clipStartAngle, zero ? clipStartAngle : clipEndAngle, innerRadius, outerRadius);
}

export function prepareRadialGaugeSeriesAnimationFunctions(initialLoad: boolean, initialStartAngle: number) {
    const phase = initialLoad ? 'initial' : 'update';

    const node: _ModuleSupport.FromToFns<AnimatableSectorDatum, Sector<AnimatableSectorDatum>, SectorAnimation> = {
        fromFn(sect, datum) {
            const previousDatum = sect.previousDatum;
            let { startAngle, endAngle } = previousDatum ?? datum;

            const previousClipSector =
                previousDatum != null && hasClipSector(previousDatum)
                    ? datumClipSector(previousDatum, initialLoad)
                    : undefined;
            const nextClipSector = hasClipSector(datum) ? datumClipSector(datum, initialLoad) : undefined;

            let clipSector: SectorBox | undefined;
            if (previousClipSector != null && nextClipSector != null) {
                // Clip sector updated
                clipSector = previousClipSector;
            } else if (previousClipSector == null && nextClipSector != null) {
                // Clip sector added
                clipSector = nextClipSector;
                startAngle = datum.startAngle;
                endAngle = datum.endAngle;
            } else if (previousClipSector != null && nextClipSector == null) {
                // Clip sector removed
                clipSector = undefined;
                startAngle = datum.startAngle;
                endAngle = datum.endAngle;
            } else if (initialLoad) {
                // No clip sector - initial load
                endAngle = startAngle;
            }

            return { startAngle, endAngle, clipSector, phase };
        },
        toFn(_sect, datum) {
            const { startAngle, endAngle } = datum;

            let clipSector: SectorBox | undefined;
            if (hasClipSector(datum)) {
                clipSector = datumClipSector(datum, false);
            }

            return { startAngle, endAngle, clipSector };
        },
        applyFn(sect, params) {
            const { startAngle, endAngle } = params;
            let { clipSector } = params;

            if (clipSector != null) {
                clipSector = new SectorBox(
                    Math.max(startAngle, clipSector.startAngle),
                    Math.min(endAngle, clipSector.endAngle),
                    clipSector.innerRadius,
                    clipSector.outerRadius
                );
            }

            const visible = clipSector == null || clipSectorVisibility(startAngle, endAngle, clipSector);

            sect.startAngle = startAngle;
            sect.endAngle = endAngle;
            sect.clipSector = clipSector;
            sect.visible = visible;
        },
    };

    const needle: _ModuleSupport.FromToFns<AnimatableNeedleDatum, RadialGaugeNeedle, NeedleAnimation> = {
        fromFn(needleNode) {
            let { angle: rotation } = needleNode.previousDatum ?? needleNode.datum;

            if (initialLoad) {
                rotation = initialStartAngle;
            }

            return { rotation, phase };
        },
        toFn(_needleNode, datum) {
            const { angle: rotation } = datum;

            return { rotation };
        },
    };

    return { node, needle };
}

export function resetRadialGaugeSeriesResetSectorFunction(_node: Sector, datum: AnimatableSectorDatum) {
    const { startAngle, endAngle } = datum;
    const clipSector = computeClipSector(datum);
    const visible = clipSector == null || clipSectorVisibility(startAngle, endAngle, clipSector);
    return { startAngle, endAngle, clipSector, visible };
}

export function resetRadialGaugeSeriesResetNeedleFunction(_node: RadialGaugeNeedle, datum: AnimatableNeedleDatum) {
    const { angle } = datum;
    return { rotation: angle };
}

const verticalAlignFactors: Record<VerticalAlign, number> = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};

interface RadialGaugeLabelLayout {
    layout: LabelFormatting;
    x: number;
    y: number;
    /** Stacked labels share one top edge, so their boxes abut rather than collide. */
    top: number;
}

interface RadialGaugeLabelOpts {
    padding: number;
    textAlign: TextAlign;
    verticalAlign: VerticalAlign;
}

export type RadialGaugeLabelFrame = { label: AgNumericValue | undefined; secondaryLabel: AgNumericValue | undefined };

export function radialGaugeLabelKey(label: LabelType) {
    return label === LabelType.Primary ? 'label' : 'secondaryLabel';
}

export interface RadialGaugeLabelTexts {
    labelDatum: RadialGaugeLabelDatum;
    labelText: NormalisedTextOrSegments;
    secondaryLabelDatum: RadialGaugeLabelDatum | undefined;
    secondaryLabelText: NormalisedTextOrSegments | undefined;
}

/** Formats the label text at the given (possibly animated) values; `undefined` when the first label has none. */
export function radialGaugeLabelTexts(
    series: _ModuleSupport.Series<any, any, any>,
    ctx: Ctx,
    labelData: Iterable<RadialGaugeLabelDatum>,
    datumOverrides?: RadialGaugeLabelFrame
): RadialGaugeLabelTexts | undefined {
    let labelDatum: RadialGaugeLabelDatum | undefined;
    let secondaryLabelDatum: RadialGaugeLabelDatum | undefined;
    for (const datum of labelData) {
        if (datum.label === LabelType.Primary) {
            labelDatum = datum;
        } else if (datum.label === LabelType.Secondary) {
            secondaryLabelDatum = datum;
        }
    }

    if (labelDatum == null) return;

    const labelText = getLabelText(series.id, ctx, labelDatum, datumOverrides?.label);
    if (labelText == null) return;

    const secondaryLabelText =
        secondaryLabelDatum == null
            ? undefined
            : getLabelText(series.id, ctx, secondaryLabelDatum, datumOverrides?.secondaryLabel);

    return { labelDatum, labelText, secondaryLabelDatum, secondaryLabelText };
}

function layoutRadialGaugeLabels(
    texts: RadialGaugeLabelTexts | undefined,
    opts: RadialGaugeLabelOpts,
    innerRadius: number
): Map<LabelType, RadialGaugeLabelLayout> {
    const { padding, textAlign, verticalAlign } = opts;
    const layouts = new Map<LabelType, RadialGaugeLabelLayout>();
    if (texts == null) return layouts;

    const { labelDatum, labelText, secondaryLabelDatum, secondaryLabelText } = texts;
    const params = { padding };
    const horizontalFactor = textAlign === 'center' ? 2 : 1;
    const verticalFactor = verticalAlign === 'middle' ? 2 : 1;
    const sizeFittingHeight = (height: number) => ({
        width: Math.sqrt(Math.max(innerRadius ** 2 - (height / verticalFactor) ** 2, 0)) * horizontalFactor,
        height: Math.min(height, verticalFactor * innerRadius),
        meta: null,
    });

    let labelLayout: LabelFormatting | undefined;
    let secondaryLabelLayout: LabelFormatting | undefined;
    let height: number;
    if (secondaryLabelDatum != null && secondaryLabelText != null) {
        const layout = formatStackedLabels(
            toPlainText(labelText),
            labelDatum,
            toPlainText(secondaryLabelText),
            secondaryLabelDatum,
            params,
            sizeFittingHeight
        );

        labelLayout = layout?.label;
        secondaryLabelLayout = layout?.secondaryLabel;
        height = layout?.height ?? 0;
        if (layout == null) {
            if (labelDatum.collision?.alwaysShow) {
                labelLayout = formatSingleLabel(toPlainText(labelText), labelDatum, params, sizeFittingHeight)?.[0];
            }
            if (secondaryLabelDatum.collision?.alwaysShow) {
                secondaryLabelLayout = formatSingleLabel(
                    toPlainText(secondaryLabelText),
                    secondaryLabelDatum,
                    params,
                    sizeFittingHeight
                )?.[0];
            }
            height = (labelLayout?.height ?? 0) + (secondaryLabelLayout?.height ?? 0);
        }
    } else {
        const layout = formatSingleLabel(toPlainText(labelText), labelDatum, params, sizeFittingHeight);

        labelLayout = layout?.[0];
        secondaryLabelLayout = undefined;
        height = layout?.[0].height ?? 0;
    }

    const rectYOffset = height * verticalAlignFactors[verticalAlign];
    for (const datum of [labelDatum, secondaryLabelDatum]) {
        const primary = datum?.label === LabelType.Primary;
        const layout = primary ? labelLayout : secondaryLabelLayout;
        if (datum == null || layout == null) continue;

        const rectOriginInLabelRect = primary ? layout.height / 2 : height - layout.height / 2;
        const x = datum.centerX;
        const y = datum.centerY + rectOriginInLabelRect - rectYOffset;
        const top = datum.centerY - rectYOffset + (primary ? 0 : height - layout.height);
        layouts.set(datum.label, { layout, x, y, top });
    }
    return layouts;
}

/** Offers the labels to the label manager at the final values. */
export function radialGaugeLabelData(
    labelData: readonly RadialGaugeLabelDatum[],
    texts: RadialGaugeLabelTexts | undefined,
    opts: RadialGaugeLabelOpts,
    innerRadius: number,
    seriesArea: BoxBounds
): GaugePointLabelDatum[] {
    const layouts = layoutRadialGaugeLabels(texts, opts, innerRadius);
    const data: GaugePointLabelDatum[] = [];
    for (const datum of labelData) {
        const placed = layouts.get(datum.label);
        if (placed == null) continue;
        const { layout, x, y, top } = placed;
        const font = { ...datum, fontSize: layout.fontSize };
        const { textAlign } = opts;
        const textBox = Text.measureBBox(layout.text, x, y, { font, lineHeight: layout.lineHeight, textAlign });
        const box = { x: textBox.x, y: top, width: textBox.width, height: layout.height };
        const key = radialGaugeLabelKey(datum.label);
        const labelDatum = gaugeLabelDatum(key, layout.text, [{ id: 0, box }], datum.collision, true, seriesArea);
        if (labelDatum != null) {
            data.push(labelDatum);
        }
    }
    return data;
}

/** Lays the labels out at the current (possibly animated) values, showing those the label manager placed. */
export function formatRadialGaugeLabels(
    selection: Selection<RadialGaugeLabelDatum, Text<RadialGaugeLabelDatum>>,
    texts: RadialGaugeLabelTexts | undefined,
    opts: RadialGaugeLabelOpts,
    innerRadius: number,
    placements: GaugeLabelPlacements
) {
    const layouts = layoutRadialGaugeLabels(texts, opts, innerRadius);

    selection.each((label, datum) => {
        const placed = layouts.get(datum.label);
        if (placed == null || !placements.has(radialGaugeLabelKey(datum.label))) {
            label.visible = false;
            return;
        }

        const { layout, x, y } = placed;
        label.visible = true;
        label.text = layout.text;
        label.fontSize = layout.fontSize;
        label.lineHeight = layout.lineHeight;
        label.textAlign = opts.textAlign;
        label.textBaseline = 'middle';
        label.x = x;
        label.y = y;
    });
}
