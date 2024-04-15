import type { AgCandlestickSeriesItemOptions } from 'ag-charts-community';
import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { CandlestickNodeDatum } from './candlestickTypes';

export enum GroupTags {
    Body,
    LowWick,
    HighWick,
}

const { SceneChangeDetection, BBox, RedrawType } = _Scene;

export abstract class CandlestickBaseGroup<TNodeDatum, TStyles>
    extends _Scene.Group
    implements _ModuleSupport.QuadtreeCompatibleNode
{
    abstract updateDatumStyles(datum: TNodeDatum, activeStyles: TStyles): void;
    abstract updateCoordinates(): void;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    x: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    y: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    yBottom: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    yHigh: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    yLow: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    width: number = 0;

    @SceneChangeDetection({ redraw: RedrawType.MAJOR })
    height: number = 0;

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

    override render(renderCtx: _Scene.RenderContext) {
        this.updateCoordinates();
        super.render(renderCtx);
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

    updateCoordinates() {
        const { x, y, yBottom, yHigh, yLow, width, height } = this;
        const selection = _Scene.Selection.select(this, _Scene.Rect);
        const [body] = selection.selectByTag<_Scene.Rect>(GroupTags.Body);
        const [lowWick] = selection.selectByTag<_Scene.Line>(GroupTags.LowWick);
        const [highWick] = selection.selectByTag<_Scene.Line>(GroupTags.HighWick);

        if (width === 0 || height === 0) {
            body.visible = false;
            lowWick.visible = false;
            highWick.visible = false;
            return;
        }

        body.visible = true;
        lowWick.visible = true;
        highWick.visible = true;

        body.setProperties({
            x,
            y,
            width,
            height,
            crisp: true,
            clipBBox: new BBox(x, y, width, height),
        });

        const halfWidth = width / 2;

        lowWick.setProperties({
            y1: Math.round(yLow + lowWick.strokeWidth / 2),
            y2: yBottom,
            x: Math.floor(x + halfWidth),
        });

        highWick.setProperties({
            y1: Math.round(yHigh + highWick.strokeWidth / 2),
            y2: y,
            x: Math.floor(x + halfWidth),
        });
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
        const [body] = selection.selectByTag<_Scene.Rect>(GroupTags.Body);
        const [lowWick] = selection.selectByTag<_Scene.Line>(GroupTags.LowWick);
        const [highWick] = selection.selectByTag<_Scene.Line>(GroupTags.HighWick);

        if (wickStyles.strokeWidth > bandwidth) {
            wickStyles.strokeWidth = bandwidth;
        }

        body.setProperties({
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
