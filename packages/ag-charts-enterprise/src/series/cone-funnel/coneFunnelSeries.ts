import {
    type AgConeFunnelSeriesLabelFormatterParams,
    type AgConeFunnelSeriesOptions,
    type AgConeFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import type { RequireOptional } from 'ag-charts-core';

import {
    BaseFunnelSeries,
    type Bounds,
    type FunnelNodeDatum,
    type FunnelNodeLabelDatum,
} from '../funnel/baseFunnelSeries';
import { ConeFunnelProperties } from './coneFunnelProperties';
import { resetLineSelectionsFn } from './coneFunnelUtil';

const { Line, ChartAxisDirection } = _ModuleSupport;

export class ConeFunnelSeries extends BaseFunnelSeries<_ModuleSupport.Line, AgConeFunnelSeriesOptions> {
    static readonly className = 'ConeFunnelSeries';
    static readonly type = 'cone-funnel' as const;

    override properties = new ConeFunnelProperties();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            animationResetFns: {
                datum: resetLineSelectionsFn,
            },
        });
    }

    override get hasData(): boolean {
        const {
            id: seriesId,
            ctx: { legendManager },
        } = this;
        const visibleItems = this.data?.data.reduce(
            (accum, _, datumIndex) => accum + (legendManager.getItemEnabled({ seriesId, itemId: datumIndex }) ? 1 : 0),
            0
        );
        return visibleItems != null && visibleItems > 1;
    }

    override getBandScalePadding() {
        return { inner: 1, outer: 0 };
    }

    protected override connectorEnabled() {
        return true;
    }

    protected getItemStyle(
        { datumIndex }: Pick<FunnelNodeDatum, 'datumIndex'>,
        _isHighlight: boolean
    ): RequireOptional<AgConeFunnelSeriesStyle> & { opacity: number } {
        return this.properties.getStyle(datumIndex);
    }

    protected override connectorStyle(index: number): RequireOptional<AgConeFunnelSeriesStyle> & { opacity: number } {
        return this.properties.getStyle(index);
    }

    protected override nodeFactory(): _ModuleSupport.Line {
        return new Line();
    }

    protected override createLabelData({
        datumIndex,
        rect,
        barAlongX,
        yDatum,
        datum,
        visible,
    }: {
        datumIndex: number;
        rect: Bounds;
        barAlongX: boolean;
        yDatum: number;
        datum: any;
        visible: boolean;
    }): FunnelNodeLabelDatum | undefined {
        const { stageKey, valueKey, label } = this.properties;
        const { spacing, placement } = label;

        if (!label.enabled) return;

        let x: number;
        let y: number;
        let textAlign: CanvasTextAlign;
        let textBaseline: CanvasTextBaseline;
        if (barAlongX) {
            x = rect.x + rect.width / 2;
            textAlign = 'center';

            switch (placement) {
                case 'before':
                    y = rect.y - spacing;
                    textBaseline = 'bottom';
                    break;
                case 'after':
                    y = rect.y + rect.height + spacing;
                    textBaseline = 'top';
                    break;
                default:
                    y = rect.y + rect.height / 2;
                    textBaseline = 'middle';
            }
        } else {
            y = rect.y + rect.height / 2;
            textBaseline = 'middle';

            switch (placement) {
                case 'before':
                    x = rect.x - spacing;
                    textAlign = 'right';
                    break;
                case 'after':
                    x = rect.x + rect.width + spacing;
                    textAlign = 'left';
                    break;
                default:
                    x = rect.x + rect.width / 2;
                    textAlign = 'center';
            }
        }

        const yDomain = this.getSeriesDomain(ChartAxisDirection.Y).domain;
        const text = this.getLabelText<AgConeFunnelSeriesLabelFormatterParams>(
            yDatum,
            datum,
            valueKey,
            'y',
            yDomain,
            label,
            { itemId: valueKey, value: yDatum, datum, stageKey, valueKey }
        );

        return {
            x,
            y,
            textAlign,
            textBaseline,
            text,
            itemId: valueKey,
            datum,
            datumIndex,
            series: this,
            visible,
        };
    }

    protected override updateDatumNodes(opts: {
        datumSelection: _ModuleSupport.Selection<_ModuleSupport.Line, FunnelNodeDatum>;
        isHighlight: boolean;
    }) {
        const highlightStyle = this.getHighlightStyle(opts.isHighlight);

        opts.datumSelection.each((line, datum) => {
            line.setProperties(resetLineSelectionsFn(line, datum));
            line.stroke = highlightStyle?.stroke;
            line.strokeWidth = highlightStyle?.strokeWidth ?? 0;
            line.strokeOpacity = highlightStyle?.strokeOpacity ?? 1;
            line.lineDash = highlightStyle?.lineDash;
            line.lineDashOffset = highlightStyle?.lineDashOffset ?? 0;
            line.opacity = highlightStyle?.opacity ?? 1;
        });
    }

    protected tooltipStyle(_datum: any, datumIndex: number) {
        const { fill, stroke, fillOpacity, strokeOpacity, strokeWidth, lineDash, lineDashOffset } =
            this.properties.getStyle(datumIndex);

        return {
            fill,
            fillOpacity,
            stroke,
            strokeOpacity,
            strokeWidth,
            lineDash,
            lineDashOffset,
        };
    }

    protected override hasItemStylers(): boolean {
        return this.properties.label.itemStyler != null;
    }
}
