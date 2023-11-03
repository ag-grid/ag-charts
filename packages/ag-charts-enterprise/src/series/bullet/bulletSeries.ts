import type { AgBulletSeriesTooltipRendererParams, Direction } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene } from 'ag-charts-community';

const { partialAssign, keyProperty, valueProperty, Validate, STRING, OPT_STRING } = _ModuleSupport;

interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export class BulletSeries extends _ModuleSupport.CartesianSeries<_Scene.Rect, BulletNodeDatum> {
    @Validate(STRING)
    valueKey: string = '';

    @Validate(OPT_STRING)
    valueName?: string = undefined;

    @Validate(STRING)
    targetKey: string = '';

    @Validate(OPT_STRING)
    targetName?: string = undefined;

    @Validate(DIRECTION)
    direction: Direction = 'vertical';

    readonly xValue: string = 'xPlaceholderValue';

    tooltip = new _ModuleSupport.SeriesTooltip<AgBulletSeriesTooltipRendererParams>();

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({ moduleCtx });
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { valueKey, targetKey, data = [] } = this;
        if (!valueKey || !targetKey || !data) return;

        const isContinuousX = _Scale.ContinuousScale.is(this.getCategoryAxis()?.scale);
        const isContinuousY = _Scale.ContinuousScale.is(this.getValueAxis()?.scale);

        await this.requestDataModel<any, any, true>(dataController, data, {
            props: [
                keyProperty(this, valueKey, isContinuousX, { id: 'xValue' }),
                valueProperty(this, valueKey, isContinuousX, { id: 'value' }),
                valueProperty(this, targetKey, isContinuousY, { id: 'target' }),
            ],
            groupByKeys: true,
            dataVisible: this.visible,
        });
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { dataModel, processedData } = this;
        if (!dataModel || !processedData) return [];

        if (direction === this.getCategoryDirection()) {
            return [this.xValue];
        } else if (direction == this.getValueAxis()?.direction) {
            const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
            const targetDomain = dataModel.getDomain(this, 'target', 'value', processedData);
            return [0, Math.max(...valueDomain, ...targetDomain)];
        } else {
            throw new Error(`unknown direction ${direction}`);
        }
    }

    override async createNodeData() {
        const { valueKey, dataModel, processedData } = this;
        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        if (!valueKey || !dataModel || !processedData || !xScale || !yScale) return [];

        const yIndex = dataModel.resolveProcessedDataIndexById(this, 'target').index;
        const context: _ModuleSupport.CartesianSeriesNodeDataContext<BulletNodeDatum> = {
            itemId: valueKey,
            nodeData: [],
            labelData: [],
            scales: super.calculateScaling(),
            visible: this.visible,
        };
        for (const { datum, values } of processedData.data) {
            const xValue = this.xValue;
            const yValue = values[0][yIndex];
            const x = xScale.convert(xValue);
            const y = yScale.convert(yValue);
            const barWidth = 5;
            const bottomY = yScale.convert(0);
            const barAlongX = this.getBarDirection() === _ModuleSupport.ChartAxisDirection.X;
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : x,
                y: barAlongX ? x : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                height: barAlongX ? barWidth : Math.abs(bottomY - y),
            };

            const nodeData: BulletNodeDatum = {
                series: this,
                datum,
                xKey: valueKey,
                xValue,
                yKey: valueKey,
                yValue,
                ...rect,
                midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
            };
            context.nodeData.push(nodeData);
        }
        return [context];
    }

    override getLegendData(legendType: _ModuleSupport.ChartLegendType) {
        // TODO(olegat)
        legendType as any;
        return [];
    }
    override getTooltipHtml(nodeDatum: BulletNodeDatum): string {
        // TODO(olegat)
        nodeDatum as any;
        return '';
    }
    protected override isLabelEnabled() {
        // TODO(olegat)
        return false;
    }
    protected override nodeFactory() {
        // TODO(olegat)
        return new _Scene.Rect();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BulletNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, undefined);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, BulletNodeDatum>;
        isHighlight: boolean;
    }) {
        opts.datumSelection.each((rect, datum) => {
            partialAssign(['x', 'y', 'height', 'width'], rect, datum);
        });
    }

    protected override async updateLabelSelection(opts: {
        labelData: BulletNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {
        return opts.labelSelection;
    }

    protected override async updateLabelNodes(_opts: {
        labelSelection: _Scene.Selection<_Scene.Text, BulletNodeDatum>;
    }) {}

    // barSeries.ts copy/pasta
    private getCategoryAxis(): _ModuleSupport.ChartAxis | undefined {
        const direction = this.getCategoryDirection();
        return this.axes[direction];
    }

    private getValueAxis(): _ModuleSupport.ChartAxis | undefined {
        const direction = this.getBarDirection();
        return this.axes[direction];
    }

    private getBarDirection() {
        if (this.direction === 'vertical') {
            return _ModuleSupport.ChartAxisDirection.Y;
        }
        return _ModuleSupport.ChartAxisDirection.X;
    }

    private getCategoryDirection() {
        if (this.direction === 'vertical') {
            return _ModuleSupport.ChartAxisDirection.X;
        }
        return _ModuleSupport.ChartAxisDirection.Y;
    }
}
