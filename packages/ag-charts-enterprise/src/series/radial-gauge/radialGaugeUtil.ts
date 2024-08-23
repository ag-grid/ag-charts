import { type TextAlign, type VerticalAlign, _ModuleSupport, _Scene } from 'ag-charts-community';

import { type LabelFormatting, formatSingleLabel, formatStackedLabels } from '../util/labelFormatter';
import type { RadialGaugeNeedle } from './radialGaugeNeedle';
import {
    LabelType,
    type RadialGaugeLabelDatum,
    type RadialGaugeLabelProperties,
    type RadialGaugeSecondaryLabelProperties,
} from './radialGaugeSeriesProperties';

const { SectorBox } = _Scene;

type AnimatableSectorDatum = {
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    clipStartAngle: number | undefined;
    clipEndAngle: number | undefined;
};

type SectorAnimation = {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
    clipSector: _Scene.SectorBox | undefined;
};

type AnimatableNeedleDatum = {
    radius: number;
    angle: number;
};

type AnimatableTargetDatum = {
    size: number;
};

export const fadeInFns: _ModuleSupport.FromToFns<_Scene.Node, any, any> = {
    fromFn: () => ({ opacity: 0, phase: 'initial' }),
    toFn: () => ({ opacity: 1 }),
};

export function computeClipSector(datum: AnimatableSectorDatum) {
    const { startAngle, endAngle, clipStartAngle, clipEndAngle, innerRadius, outerRadius } = datum;

    if (clipStartAngle == null || clipEndAngle == null) return;

    return new SectorBox(
        Math.max(clipStartAngle, startAngle),
        Math.min(clipEndAngle, endAngle),
        innerRadius,
        outerRadius
    );
}

export function clipSectorVisibility(startAngle: number, endAngle: number, clipSector: _Scene.SectorBox) {
    return Math.max(startAngle, clipSector.startAngle) <= Math.min(endAngle, clipSector.endAngle);
}

export function prepareRadialGaugeSeriesAnimationFunctions(initialLoad: boolean) {
    const phase = initialLoad ? 'initial' : 'update';

    const node: _ModuleSupport.FromToFns<_Scene.Sector, SectorAnimation, AnimatableSectorDatum> = {
        fromFn(sect, datum) {
            const previousDatum: AnimatableSectorDatum = sect.previousDatum ?? datum;
            const { startAngle, endAngle, clipStartAngle, clipEndAngle, innerRadius } = previousDatum;
            let { outerRadius } = previousDatum;

            if (initialLoad) {
                outerRadius = innerRadius;
            }

            const clipSector =
                clipStartAngle != null && clipEndAngle != null
                    ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                    : undefined;

            return { startAngle, endAngle, innerRadius, outerRadius, clipSector, phase };
        },
        toFn(_sect, datum, status) {
            const { startAngle, endAngle, clipStartAngle, clipEndAngle } = datum;
            let { innerRadius, outerRadius } = datum;

            if (status === 'removed') {
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
            }

            const clipSector =
                clipStartAngle != null && clipEndAngle != null
                    ? new SectorBox(clipStartAngle, clipEndAngle, innerRadius, outerRadius)
                    : undefined;

            return { startAngle, endAngle, outerRadius, innerRadius, clipSector };
        },
        mapFn(params, datum) {
            const { clipStartAngle, clipEndAngle } = datum;
            const { startAngle, endAngle, outerRadius, innerRadius } = params;
            let { clipSector } = params;

            if (clipSector != null && clipStartAngle != null && clipEndAngle != null) {
                clipSector = new SectorBox(
                    Math.max(startAngle, clipSector.startAngle),
                    Math.min(endAngle, clipSector.endAngle),
                    clipSector.innerRadius,
                    clipSector.outerRadius
                );
            }

            const visible = clipSector == null || clipSectorVisibility(startAngle, endAngle, clipSector);

            return { visible, startAngle, endAngle, outerRadius, innerRadius, clipSector };
        },
    };

    const needle: _ModuleSupport.FromToFns<RadialGaugeNeedle, any, AnimatableNeedleDatum> = {
        fromFn(needleNode, datum) {
            let { rotation, scalingX, scalingY } = needleNode;

            if (initialLoad) {
                scalingX = 0;
                scalingY = 0;
                rotation = datum.angle;
            }

            return { rotation, scalingX, scalingY, phase };
        },
        toFn(_needleNode, datum, status) {
            let scalingX = datum.radius * 2;
            let scalingY = datum.radius * 2;
            const { angle: rotation } = datum;

            if (status === 'removed') {
                scalingX = 0;
                scalingY = 0;
            }

            return { rotation, scalingX, scalingY };
        },
    };

    const target: _ModuleSupport.FromToFns<_Scene.Marker, any, AnimatableTargetDatum> = {
        fromFn(_targetNode, datum) {
            const { size } = datum;

            let scalingX = size;
            let scalingY = size;
            if (initialLoad) {
                scalingX = 0;
                scalingY = 0;
            }

            return { scalingX, scalingY, phase };
        },
        toFn(_targetNode, datum, status) {
            const { size } = datum;

            let scalingX = size;
            let scalingY = size;
            if (status === 'removed') {
                scalingX = 0;
                scalingY = 0;
            }

            return { scalingX, scalingY };
        },
    };

    return { node, needle, target };
}

function getLabelText(
    series: _ModuleSupport.Series<any, any>,
    label: RadialGaugeLabelProperties | RadialGaugeSecondaryLabelProperties,
    value: number | undefined,
    defaultFormatter?: (value: number) => void
) {
    if (label.text != null) {
        return label.text;
    } else if (value != null) {
        return label?.formatter?.({ seriesId: series.id, datum: undefined, value }) ?? defaultFormatter?.(value);
    }
}

const verticalAlignFactors: Record<VerticalAlign, number> = {
    top: 0,
    middle: 0.5,
    bottom: 1,
};

export function formatRadialGaugeLabels(
    series: _ModuleSupport.Series<any, any>,
    selection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum>,
    labelProps: RadialGaugeLabelProperties,
    secondaryLabelProps: RadialGaugeSecondaryLabelProperties,
    opts: { padding: number; textAlign: TextAlign; verticalAlign: VerticalAlign },
    innerRadius: number,
    defaultFormatter: (value: number) => void,
    datumOverrides?: { label: number; secondaryLabel: number }
) {
    const { padding, textAlign, verticalAlign } = opts;

    let labelDatum: RadialGaugeLabelDatum | undefined;
    let secondaryLabelDatum: RadialGaugeLabelDatum | undefined;
    selection.each((_node, datum) => {
        if (datum.label === LabelType.Primary) {
            labelDatum = datum;
        } else if (datum.label === LabelType.Secondary) {
            secondaryLabelDatum = datum;
        }
    });

    const labelText = getLabelText(series, labelProps, datumOverrides?.label ?? labelDatum?.value, defaultFormatter);
    if (labelText == null) return;
    const secondaryLabelText = getLabelText(
        series,
        secondaryLabelProps,
        datumOverrides?.secondaryLabel ?? secondaryLabelDatum?.value
    );

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
    if (secondaryLabelText != null) {
        const layout = formatStackedLabels(
            labelText,
            labelProps,
            secondaryLabelText,
            secondaryLabelProps,
            params,
            sizeFittingHeight
        );

        labelLayout = layout?.label;
        secondaryLabelLayout = layout?.secondaryLabel;
        height = layout?.height ?? 0;
    } else {
        const layout = formatSingleLabel(labelText, labelProps, params, sizeFittingHeight);

        labelLayout = layout?.[0];
        secondaryLabelLayout = undefined;
        height = layout?.[0].height ?? 0;
    }

    const rectYOffset = height * verticalAlignFactors[verticalAlign];
    selection.each((label, datum) => {
        let layout: LabelFormatting | undefined;
        if (datum.label === LabelType.Primary) {
            layout = labelLayout;
        } else if (datum.label === LabelType.Secondary) {
            layout = secondaryLabelLayout;
        }

        if (layout == null) {
            label.visible = false;
            return;
        }

        label.visible = true;
        label.text = layout.text;
        label.fontSize = layout.fontSize;
        label.lineHeight = layout.lineHeight;
        label.textAlign = textAlign;
        label.textBaseline = 'middle';

        const rectOriginInLabelRect =
            datum.label === LabelType.Primary ? layout.height / 2 : height - layout.height / 2;
        label.y = datum.centerY + rectOriginInLabelRect - rectYOffset;
        label.x = datum.centerX;
    });
}

export function resetRadialGaugeSeriesAnimationFunctions(_node: _Scene.Sector, datum: AnimatableSectorDatum) {
    return {
        startAngle: datum.startAngle,
        endAngle: datum.endAngle,
        innerRadius: datum.innerRadius,
        outerRadius: datum.outerRadius,
    };
}
