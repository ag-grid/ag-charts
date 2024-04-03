import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { CandlestickNodeDatum } from './candlestickTypes';

export enum GroupTags {
    Rect,
    Outline,
    Wick,
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
            new _Scene.Rect({ tag: GroupTags.Rect }),
            new _Scene.Line({ tag: GroupTags.Wick }),
            new _Scene.Line({ tag: GroupTags.Wick }),
        ]);
    }

    updateDatumStyles(datum: CandlestickNodeDatum, activeStyles: AgCandlestickSeriesItemOptions) {
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
            wick: wickStyles = {},
            cornerRadius,
        } = activeStyles;

        wickStyles.strokeWidth ??= 1;

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
