import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community/src/options/next';

import type { CandlestickNodeDatum } from './candlestickTypes';

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
        const yHigh = Math.min(highValue, lowValue);
        const yLow = Math.max(highValue, lowValue);

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

        wicks[0].setProperties({
            y1: Math.round(yLow + wickStyles.strokeWidth / 2),
            y2: yBottom,
            x: Math.floor(axisValue + bandwidth / 2),
        });
        wicks[0].setProperties(wickStyles);

        wicks[1].setProperties({
            y1: Math.round(yHigh - wickStyles.strokeWidth / 2),
            y2: y,
            x: Math.floor(axisValue + bandwidth / 2),
        });
        wicks[1].setProperties(wickStyles);
    }
}
