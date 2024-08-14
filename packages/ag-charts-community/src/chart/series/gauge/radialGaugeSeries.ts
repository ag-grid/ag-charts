import type { AgRadialGaugeSeriesStyle } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import type { PointLabelDatum } from '../../../scene/util/labelPlacement';
import { createDatumId } from '../../data/processors';
import type { ChartLegendDatum, ChartLegendType } from '../../legendDatum';
import { EMPTY_TOOLTIP_CONTENT, type TooltipContent } from '../../tooltip/tooltip';
import { type PickFocusInputs, Series, type SeriesNodeDataContext, SeriesNodePickMode } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { RadialGaugeSeriesProperties } from './radialGaugeSeriesProperties';

type RadialGaugeNodeDatum = SeriesNodeDatum;
type RadialGaugeLabelDatum = never;

export interface RadialGaugeNodeDataContext
    extends SeriesNodeDataContext<RadialGaugeNodeDatum, RadialGaugeLabelDatum> {}

export class RadialGaugeSeries extends Series<
    RadialGaugeNodeDatum,
    RadialGaugeSeriesProperties,
    RadialGaugeLabelDatum,
    RadialGaugeNodeDataContext
> {
    static readonly className = 'RadialGaugeSeries';
    static readonly type = 'radial-gauge' as const;

    override properties = new RadialGaugeSeriesProperties();

    public getNodeData(): RadialGaugeNodeDatum[] | undefined {
        return this.contextNodeData?.nodeData;
    }

    // private readonly colorScale = new ColorScale();

    private readonly itemGroup = this.contentGroup.appendChild(new Group({ name: 'itemGroup' }));
    private readonly itemLabelGroup = this.contentGroup.appendChild(new Group({ name: 'itemLabelGroup' }));

    public datumSelection: Selection<Sector, RadialGaugeNodeDatum> = Selection.select(this.itemGroup, () =>
        this.nodeFactory()
    );
    private labelSelection: Selection<Text, RadialGaugeLabelDatum> = Selection.select(this.itemLabelGroup, Text);
    private highlightDatumSelection: Selection<Sector, RadialGaugeNodeDatum> = Selection.select(
        this.highlightNode,
        () => this.nodeFactory()
    );

    public contextNodeData?: RadialGaugeNodeDataContext;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            contentGroupVirtual: false,
            useLabelLayer: true,
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH, SeriesNodePickMode.NEAREST_NODE],
        });

        this.itemLabelGroup.pointerEvents = PointerEvents.None;
    }

    private isLabelEnabled() {
        return false;
    }

    private nodeFactory(): Sector {
        return new Sector();
    }

    override async processData(): Promise<void> {}

    override async createNodeData() {
        const { id: seriesId } = this;
        const { value } = this.properties;
        const nodeData: RadialGaugeNodeDatum[] = [];
        const labelData: RadialGaugeLabelDatum[] = [];

        nodeData.push({
            series: this,
            datum: value,
        });

        return {
            itemId: seriesId,
            nodeData,
            labelData,
        };
    }

    async updateSelections(): Promise<void> {
        if (this.nodeDataRefresh) {
            this.contextNodeData = await this.createNodeData();
            this.nodeDataRefresh = false;
        }
    }

    override async update(): Promise<void> {
        const { datumSelection, labelSelection, highlightDatumSelection } = this;

        await this.updateSelections();

        this.contentGroup.visible = this.visible;
        this.contentGroup.opacity = this.getOpacity();

        let highlightedDatum: RadialGaugeNodeDatum | undefined = this.ctx.highlightManager?.getActiveHighlight() as any;
        if (highlightedDatum != null && (highlightedDatum.series !== this || highlightedDatum.datum == null)) {
            highlightedDatum = undefined;
        }

        const nodeData = this.contextNodeData?.nodeData ?? [];
        const labelData = this.contextNodeData?.labelData ?? [];

        this.datumSelection = await this.updateDatumSelection({ nodeData, datumSelection });
        await this.updateDatumNodes({ datumSelection, isHighlight: false });

        this.labelSelection = await this.updateLabelSelection({ labelData, labelSelection });
        await this.updateLabelNodes({ labelSelection });

        this.highlightDatumSelection = await this.updateDatumSelection({
            nodeData: highlightedDatum != null ? [highlightedDatum] : [],
            datumSelection: highlightDatumSelection,
        });
        await this.updateDatumNodes({ datumSelection: highlightDatumSelection, isHighlight: true });
    }

    private async updateDatumSelection(opts: {
        nodeData: RadialGaugeNodeDatum[];
        datumSelection: Selection<Sector, RadialGaugeNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, () => createDatumId([]));
    }

    private async updateDatumNodes(opts: {
        datumSelection: Selection<Sector, RadialGaugeNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection } = opts;

        datumSelection.each((_sector, _datum) => {});
    }

    private async updateLabelSelection(opts: {
        labelData: RadialGaugeLabelDatum[];
        labelSelection: Selection<Text, RadialGaugeLabelDatum>;
    }) {
        const labels = this.isLabelEnabled() ? opts.labelData : [];
        return opts.labelSelection.update(labels);
    }

    private async updateLabelNodes(opts: { labelSelection: Selection<Text, RadialGaugeLabelDatum> }) {
        const { labelSelection } = opts;

        labelSelection.each((_label, _datum) => {});
    }

    resetAnimation() {
        // No animations
    }

    override getLabelData(): PointLabelDatum[] {
        return [];
    }

    override getSeriesDomain() {
        return [NaN, NaN];
    }

    override getLegendData(_legendType: unknown): ChartLegendDatum<any>[] | ChartLegendDatum<ChartLegendType>[] {
        return [];
    }

    override getTooltipHtml(nodeDatum: Sector): TooltipContent {
        const { id: seriesId, properties } = this;

        if (!properties.isValid()) {
            return EMPTY_TOOLTIP_CONTENT;
        }

        const { tooltip } = properties;
        const { datum, fill } = nodeDatum;

        const title = '';
        const content = '';

        let format: AgRadialGaugeSeriesStyle | undefined;

        // if (itemStyler) {
        //     format = callbackCache.call(itemStyler, {
        //         seriesId,
        //         datum,
        //         highlighted: false,
        //     });
        // }

        const color = format?.fill ?? fill;

        return tooltip.toTooltipHtml(
            { title, content, backgroundColor: color },
            {
                seriesId,
                datum,
                title,
                color,
                itemId: undefined!,
                ...this.getModuleTooltipParams(),
            }
        );
    }

    computeFocusBounds(_opts: PickFocusInputs): Path | undefined {
        return;
    }
}
