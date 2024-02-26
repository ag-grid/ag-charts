import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { CandlestickNodeDatum } from './candlestickTypes';

const { Logger } = _Util;

export enum GroupTags {
    Rect,
    Outline,
    Wick,
}

export type ActiveCandlestickGroupStyles = AgCandlestickSeriesItemOptions;

export class CandlestickGroup extends _Scene.Group {
    constructor() {
        super();
        this.append([
            new _Scene.Rect({ tag: GroupTags.Rect }),
            new _Scene.Line({ tag: GroupTags.Wick }),
            new _Scene.Line({ tag: GroupTags.Wick }),
        ]);
    }

    updateDatumStyles(
        datum: CandlestickNodeDatum,
        activeStyles: _ModuleSupport.DeepRequired<ActiveCandlestickGroupStyles>
    ) {
        const {
            bandwidth,
            scaledValues: { xValue: axisValue },
            lowKey = '',
            highKey = '',
            xKey,
            datum: rawDatum,
        } = datum;
        const { openValue, closeValue, highValue, lowValue } = datum.scaledValues;

        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick: wickStyles,
            cornerRadius,
        } = activeStyles;

        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [rect] = selection.selectByTag<_Scene.Rect>(GroupTags.Rect);
        const wicks = selection.selectByTag<_Scene.Line>(GroupTags.Wick);

        if (wickStyles.strokeWidth > bandwidth) {
            wickStyles.strokeWidth = bandwidth;
        }

        const y = Math.min(openValue, closeValue);
        const yBottom = Math.max(openValue, closeValue);

        rect.setProperties({
            x: axisValue,
            y,
            width: bandwidth,
            height: yBottom - y,
        });

        rect.setProperties({
            fill,
            fillOpacity,
            strokeWidth,
            strokeOpacity,
            stroke,
            lineDash,
            lineDashOffset,
            cornerRadius,
        });

        // scaled values
        const validLowValue = lowValue >= openValue && lowValue >= closeValue;
        const validHighValue = highValue <= openValue && highValue <= closeValue;

        if (validLowValue) {
            wicks[0].setProperties({
                y1: Math.round(lowValue + wickStyles.strokeWidth / 2),
                y2: yBottom,
                x: Math.floor(axisValue + bandwidth / 2),
            });
            wicks[0].setProperties(wickStyles);
        } else if (!isNaN(lowValue)) {
            Logger.warnOnce(
                `invalid low value [${rawDatum[lowKey]}] at x value: [${rawDatum[xKey]}], low value cannot be higher than datum open or close values`
            );
        }

        if (validHighValue) {
            wicks[1].setProperties({
                y1: Math.round(highValue - wickStyles.strokeWidth / 2),
                y2: y,
                x: Math.floor(axisValue + bandwidth / 2),
            });

            wicks[1].setProperties(wickStyles);
        } else if (!isNaN(highValue)) {
            Logger.warnOnce(
                `invalid high value [${rawDatum[highKey]}] at x value: [${rawDatum[xKey]}], high value cannot be lower than datum open or close values.`
            );
        }
    }
}
