import { _ModuleSupport, _Scene } from 'ag-charts-community';

import { type LabelFormatting, formatSingleLabel, formatStackedLabels } from '../util/labelFormatter';
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

export function prepareRadialGaugeSeriesAnimationFunctions(initialLoad: boolean) {
    const phase = initialLoad ? 'initial' : 'update';

    const fns: _ModuleSupport.FromToFns<_Scene.Sector, any, AnimatableSectorDatum> = {
        fromFn(sect, datum) {
            let { startAngle, endAngle, innerRadius, outerRadius } = sect;
            let clipStartAngle = sect.clipSector?.startAngle;
            let clipEndAngle = sect.clipSector?.endAngle;

            if (initialLoad) {
                startAngle = datum.startAngle;
                endAngle = datum.endAngle;
                innerRadius = datum.innerRadius;
                outerRadius = datum.innerRadius;
                clipStartAngle = datum.clipStartAngle;
                clipEndAngle = datum.clipEndAngle;
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
    };

    return fns;
}

function getLabelText(
    series: _ModuleSupport.Series<any, any>,
    label: RadialGaugeLabelProperties | RadialGaugeSecondaryLabelProperties,
    value: number | undefined
) {
    return (
        label.text ?? (value != null ? label?.formatter?.({ seriesId: series.id, datum: undefined, value }) : undefined)
    );
}

export function formatRadialGaugeLabels(
    series: _ModuleSupport.Series<any, any>,
    selection: _Scene.Selection<_Scene.Text, RadialGaugeLabelDatum>,
    labelProps: RadialGaugeLabelProperties,
    secondaryLabelProps: RadialGaugeSecondaryLabelProperties,
    padding: number,
    innerRadius: number,
    datumOverrides?: { label: number; secondaryLabel: number }
) {
    let labelDatum: RadialGaugeLabelDatum | undefined;
    let secondaryLabelDatum: RadialGaugeLabelDatum | undefined;
    selection.each((_node, datum) => {
        if (datum.label === LabelType.Primary) {
            labelDatum = datum;
        } else if (datum.label === LabelType.Secondary) {
            secondaryLabelDatum = datum;
        }
    });

    const labelText = getLabelText(series, labelProps, datumOverrides?.label ?? labelDatum?.value);
    if (labelText == null) return;
    const secondaryLabelText = getLabelText(
        series,
        secondaryLabelProps,
        datumOverrides?.secondaryLabel ?? secondaryLabelDatum?.value
    );

    const params = { padding };
    const sizeFittingHeight = (height: number) => ({
        width: 2 * Math.sqrt(innerRadius ** 2 - (height / 2) ** 2),
        height: Math.min(height, 2 * innerRadius),
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

        const rectOriginInLabelRect =
            datum.label === LabelType.Primary ? layout.height / 2 : height - layout.height / 2;
        label.y = datum.centerY + rectOriginInLabelRect - height / 2;
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
