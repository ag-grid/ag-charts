import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { CandlestickNodeDatum } from './candlestickTypes';

export enum GroupTags {
    Body,
    LowWick,
    HighWick,
}

export abstract class CandlestickBaseGroup<TNodeDatum, TStyles>
    extends _Scene.Group
    implements _ModuleSupport.QuadtreeCompatibleNode
{
    abstract updateDatumStyles(datum: TNodeDatum, activeStyles: TStyles): void;

    distanceSquared(x: number, y: number): number {
        const nodes = _Scene.Selection.selectByClass<_Scene.Rect | _Scene.Line>(this, _Scene.Rect, _Scene.Line);
        return _Scene.nearestSquared(x, y, nodes).distanceSquared;
    }

    get midPoint(): { x: number; y: number } {
        const datum: { midPoint?: { readonly x: number; readonly y: number } } = this.datum;
        if (datum.midPoint === undefined) {
            _Util.Logger.error('CandlestickBaseGroup.datum.midPoint is undefined');
            return { x: NaN, y: NaN };
        }
        return datum.midPoint;
    }
}

export class CandlestickGroup extends CandlestickBaseGroup<CandlestickNodeDatum, AgCandlestickSeriesItemOptions> {
    constructor() {
        super();
        this.append([
            new _Scene.Rect({ tag: GroupTags.Body }),
            new _Scene.Line({ tag: GroupTags.LowWick }),
            new _Scene.Line({ tag: GroupTags.HighWick }),
        ]);
    }

    updateDatumStyles(datum: CandlestickNodeDatum, activeStyles: AgCandlestickSeriesItemOptions) {
        const { bandwidth } = datum;

        const {
            fill,
            fillOpacity,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wick: wickStyles = {},
            cornerRadius,
        } = activeStyles;

        wickStyles.strokeWidth ??= 1;

        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [rect] = selection.selectByTag<_Scene.Rect>(GroupTags.Body);
        const [lowWick] = selection.selectByTag<_Scene.Line>(GroupTags.LowWick);
        const [highWick] = selection.selectByTag<_Scene.Line>(GroupTags.HighWick);

        if (wickStyles.strokeWidth > bandwidth) {
            wickStyles.strokeWidth = bandwidth;
        }

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

        lowWick.setProperties(wickStyles);
        highWick.setProperties(wickStyles);
    }
}
