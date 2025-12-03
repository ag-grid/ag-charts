import { _ModuleSupport } from 'ag-charts-community';
import { ChartAxisDirection } from 'ag-charts-core';

interface TopologySeriesNodeDatum extends _ModuleSupport.DataModelSeriesNodeDatum {
    legendItemName?: string;
}

interface TopologySeriesNodeDataContext<
    TDatum extends TopologySeriesNodeDatum = TopologySeriesNodeDatum,
    TLabel extends object = object,
> extends _ModuleSupport.DataModelSeriesNodeDataContext<TDatum, TLabel> {}

abstract class TopologySeriesProperties<T extends object> extends _ModuleSupport.SeriesProperties<T> {
    legendItemName?: string;
}

export abstract class TopologySeries<
    TDatum extends TopologySeriesNodeDatum,
    TOpts extends object,
    TProps extends TopologySeriesProperties<TOpts>,
    TLabel extends object,
    TContext extends TopologySeriesNodeDataContext<TDatum, TLabel> = TopologySeriesNodeDataContext<TDatum, TLabel>,
> extends _ModuleSupport.DataModelSeries<TDatum, TOpts, TProps, TLabel, TContext> {
    constructor(options: _ModuleSupport.DataModelSeriesConstructorOpts<TProps>) {
        super(options);

        this.cleanup.register(
            this.ctx.eventsHub.on('data:update', () => {}),
            this.ctx.eventsHub.on('legend:item-click', (event) => {
                this.onLegendItemClick(event);
            }),
            this.ctx.eventsHub.on('legend:item-double-click', (event) => {
                this.onLegendItemDoubleClick(event);
            })
        );
    }

    override getSeriesDomain() {
        return [Number.NaN, Number.NaN];
    }

    override getSeriesRange(_direction: ChartAxisDirection, _visibleRange: [any, any]): [number, number] {
        return [Number.NaN, Number.NaN];
    }

    protected getHighlightedDatum(): TDatum | undefined {
        let highlightedDatum: TDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        const { legendItemName } = this.properties;
        const matchingLegendItemName =
            legendItemName != null &&
            highlightedDatum?.datum == null &&
            legendItemName === highlightedDatum?.legendItemName;

        if (
            highlightedDatum != null &&
            ((highlightedDatum.series !== this && !matchingLegendItemName) || highlightedDatum.datum == null)
        ) {
            highlightedDatum = undefined;
        }

        return highlightedDatum;
    }
}
