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
