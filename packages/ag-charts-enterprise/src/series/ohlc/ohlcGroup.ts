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

    updateCoordinates() {
        const { x, y, yBottom, yHigh, yLow, width } = this;
        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Line>(GroupTags.Body);
        const [open] = selection.selectByTag<_Scene.Line>(GroupTags.Open);
        const [close] = selection.selectByTag<_Scene.Line>(GroupTags.Close);

        const halfWidth = width / 2;

        body.setProperties({
            x1: Math.floor(x + halfWidth),
            x2: Math.floor(x + halfWidth),
            y1: yHigh,
            y2: yLow,
        });

        open.setProperties({
            x1: Math.floor(x),
            x2: Math.floor(x + halfWidth),
            y: Math.round(y + open.strokeWidth / 2),
        });

        close.setProperties({
            x1: Math.floor(x + halfWidth),
            x2: Math.floor(x + width),
            y: Math.round(yBottom - close.strokeWidth / 2),
        });
    }

    updateDatumStyles(_datum: OhlcNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgOhlcSeriesItemOptions>) {
        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Line>(GroupTags.Body);
        const [open] = selection.selectByTag<_Scene.Line>(GroupTags.Open);
        const [close] = selection.selectByTag<_Scene.Line>(GroupTags.Close);

        body.setProperties(activeStyles);
        open.setProperties(activeStyles);
        close.setProperties(activeStyles);
    }
}
