import type { AgOhlcSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import { CandlestickBaseGroup } from '../candlestick/candlestickGroup';
import type { OhlcNodeDatum } from './ohlcTypes';

export enum GroupTags {
    Body,
    Open,
    Close,
}

export class OhlcGroup extends CandlestickBaseGroup<
    OhlcNodeDatum,
    _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>
> {
    constructor() {
        super();
        this.append([
            new _Scene.Line({ tag: GroupTags.Body }),
            new _Scene.Line({ tag: GroupTags.Open }),
            new _Scene.Line({ tag: GroupTags.Close }),
        ]);
    }

    updateDatumStyles(datum: OhlcNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>) {
        const {
            bandwidth,
            scaledValues: { xValue: axisValue },
        } = datum;
        const { openValue, closeValue, highValue, lowValue } = datum.scaledValues;

        const { strokeWidth } = activeStyles;

        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Line>(GroupTags.Body);
        const [open] = selection.selectByTag<_Scene.Line>(GroupTags.Open);
        const [close] = selection.selectByTag<_Scene.Line>(GroupTags.Close);

        const yHigh = Math.min(highValue, lowValue);
        const yLow = Math.max(highValue, lowValue);

        body.setProperties({
            x: Math.floor(axisValue + bandwidth / 2),
            y: yHigh,
            y2: yLow,
        });

        body.setProperties(activeStyles);

        open.setProperties({
            y: Math.round(openValue + strokeWidth / 2),
            x1: Math.floor(axisValue),
            x2: Math.floor(axisValue + bandwidth / 2),
        });
        open.setProperties(activeStyles);

        close.setProperties({
            y: Math.round(closeValue - strokeWidth / 2),
            x1: Math.floor(axisValue + bandwidth / 2),
            x2: Math.floor(axisValue + bandwidth),
        });
        close.setProperties(activeStyles);
    }
}
