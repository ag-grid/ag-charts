import type { AgBulletSeriesTooltipRendererParams, Direction } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const {
    keyProperty,
    partialAssign,
    valueProperty,
    Validate,
    COLOR_STRING,
    DIRECTION,
    STRING,
    OPT_ARRAY,
    OPT_NUMBER,
    OPT_STRING,
} = _ModuleSupport;
const { sanitizeHtml } = _Util;

interface BulletNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly cumulativeValue: number;
    readonly target?: {
        readonly value: number;
        readonly x1: number;
        readonly y1: number;
        readonly x2: number;
        readonly y2: number;
    };
}

class BulletColorRange {
    @Validate(COLOR_STRING)
    color: string = 'grey';

    @Validate(OPT_NUMBER())
    stop?: number = undefined;
}

interface NormalizedColorRange {
    color: string;
    start: number;
    stop: number;
}

class BulletNode extends _Scene.Group {
    private valueRect: _Scene.Rect = new _Scene.Rect();
    private targetLine: _Scene.Line = new _Scene.Line();

    public constructor() {
        super();
        this.append(this.valueRect);
        this.append(this.targetLine);
    }

    public update(datum: BulletNodeDatum) {
        partialAssign(['x', 'y', 'height', 'width'], this.valueRect, datum);
        this.valueRect.visible = true;

        partialAssign(['x1', 'x2', 'y1', 'y2'], this.targetLine, datum.target);
        this.targetLine.stroke = 'black';
        this.targetLine.strokeWidth = 3;
        this.targetLine.visible = datum.target !== undefined;
    }
}

export class BulletSeries extends _ModuleSupport.CartesianSeries<BulletNode, BulletNodeDatum> {
    @Validate(STRING)
    valueKey: string = '';

    @Validate(OPT_STRING)
    valueName?: string = undefined;

    @Validate(OPT_STRING)
    targetKey?: string = undefined;

    @Validate(OPT_STRING)
    targetName?: string = undefined;

    @Validate(DIRECTION)
    direction: Direction = 'vertical';

    @Validate(OPT_ARRAY())
    colorRanges?: BulletColorRange[] = undefined;

    tooltip = new _ModuleSupport.SeriesTooltip<AgBulletSeriesTooltipRendererParams>();

    private normalizedColorRanges: NormalizedColorRange[] = [];
    private colorRangesGroup: _Scene.Group;
    private colorRangesSelection: _Scene.Selection<_Scene.Rect, NormalizedColorRange>;

    constructor(moduleCtx: _ModuleSupport.ModuleContext) {
        super({
            moduleCtx,
            pickModes: [_ModuleSupport.SeriesNodePickMode.EXACT_SHAPE_MATCH],
            hasHighlightedLabels: true,
        });
        this.colorRangesGroup = new _Scene.Group({ name: `${this.id}-colorRanges` });
        this.colorRangesSelection = _Scene.Selection.select(this.colorRangesGroup, _Scene.Rect);
        this.rootGroup.append(this.colorRangesGroup);
    }

    override destroy() {
        this.rootGroup.removeChild(this.colorRangesGroup);
        super.destroy();
    }

    override async processData(dataController: _ModuleSupport.DataController) {
        const { valueKey, targetKey, data = [] } = this;
        if (!valueKey || !data) return;

        const isContinuousX = _Scale.ContinuousScale.is(this.getCategoryAxis()?.scale);
        const isContinuousY = _Scale.ContinuousScale.is(this.getValueAxis()?.scale);

        const props = [
            keyProperty(this, valueKey, isContinuousX, { id: 'xValue' }),
            valueProperty(this, valueKey, isContinuousY, { id: 'value' }),
        ];
        if (targetKey !== undefined) {
            props.push(valueProperty(this, targetKey, isContinuousY, { id: 'target' }));
        }

        await this.requestDataModel<any, any, true>(dataController, data, {
            props,
            groupByKeys: true,
            dataVisible: this.visible,
        });
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        const { dataModel, processedData, targetKey } = this;
        if (!dataModel || !processedData) return [];

        if (direction === this.getCategoryDirection()) {
            return [this.valueName ?? this.valueKey];
        } else if (direction == this.getValueAxis()?.direction) {
            const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
            const targetDomain =
                targetKey === undefined ? [] : dataModel.getDomain(this, 'target', 'value', processedData);
            return [0, Math.max(...valueDomain, ...targetDomain)];
        } else {
            throw new Error(`unknown direction ${direction}`);
        }
    }

    override getKeys(direction: _ModuleSupport.ChartAxisDirection): string[] {
        if (direction === this.getBarDirection()) {
            return [this.valueKey];
        }
        return super.getKeys(direction);
    }

    override async createNodeData() {
        const { valueKey, targetKey, dataModel, processedData } = this;
        const xScale = this.getCategoryAxis()?.scale;
        const yScale = this.getValueAxis()?.scale;
        if (!valueKey || !dataModel || !processedData || !xScale || !yScale) return [];

        this.colorRangesGroup.visible = this.colorRanges !== undefined;

        const valueIndex = dataModel.resolveProcessedDataIndexById(this, 'value').index;
        const targetIndex =
            targetKey === undefined ? NaN : dataModel.resolveProcessedDataIndexById(this, 'target').index;
        const context: _ModuleSupport.CartesianSeriesNodeDataContext<BulletNodeDatum> = {
            itemId: valueKey,
            nodeData: [],
            labelData: [],
            scales: super.calculateScaling(),
            visible: this.visible,
        };
        for (const { datum, values } of processedData.data) {
            const xValue = this.valueName ?? this.valueKey;
            const yValue = values[0][valueIndex];
            const x = xScale.convert(xValue);
            const y = yScale.convert(yValue);
            const barWidth = 8;
            const bottomY = yScale.convert(0);
            const barAlongX = this.getBarDirection() === _ModuleSupport.ChartAxisDirection.X;
            const rect = {
                x: barAlongX ? Math.min(y, bottomY) : x,
                y: barAlongX ? x : Math.min(y, bottomY),
                width: barAlongX ? Math.abs(bottomY - y) : barWidth,
                height: barAlongX ? barWidth : Math.abs(bottomY - y),
            };

            let target;
            if (this.targetKey) {
                const targetLineLength = 20;
                const targetValue = values[0][targetIndex];
                if (!isNaN(targetValue) && targetValue !== undefined) {
                    const convertedY = yScale.convert(targetValue);
                    const convertedX = xScale.convert(xValue) + barWidth / 2;
                    let x1 = convertedX - targetLineLength / 2;
                    let x2 = convertedX + targetLineLength / 2;
                    let [y1, y2] = [convertedY, convertedY];
                    if (barAlongX) {
                        [x1, x2, y1, y2] = [y1, y2, x1, x2];
                    }
                    target = { value: targetValue, x1, x2, y1, y2 };
                }
            }

            const nodeData: BulletNodeDatum = {
                series: this,
                datum,
                xKey: valueKey,
                xValue,
                yKey: valueKey,
                yValue,
                cumulativeValue: yValue,
                target,
                ...rect,
                midPoint: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
            };
            context.nodeData.push(nodeData);
        }

        if (this.colorRanges) {
            const maxValue = Math.max(...(this.getSeriesDomain(this.getBarDirection()) as number[]));
            const sortedRanges = [...this.colorRanges].sort((a, b) => (a.stop || maxValue) - (b.stop || maxValue));
            let start = 0;
            this.normalizedColorRanges = sortedRanges.map((item) => {
                const stop = item.stop === undefined ? maxValue : item.stop;
                const result = { color: item.color, start, stop };
                start = stop;
                return result;
            });
        }

        return [context];
    }

    override getLegendData(legendType: _ModuleSupport.ChartLegendType) {
        // TODO(olegat)
        legendType as any;
        return [];
    }

    override getTooltipHtml(nodeDatum: BulletNodeDatum): string {
        const { valueKey, valueName, targetKey, targetName } = this;
        const axis = this.getValueAxis();
        const { yValue: valueValue, target: { value: targetValue } = { value: undefined }, datum } = nodeDatum;

        if (valueKey === undefined || valueValue === undefined || axis === undefined) {
            return '';
        }

        const makeLine = (key: string, name: string | undefined, value: number) => {
            const nameString = sanitizeHtml(name ?? key);
            const valueString = sanitizeHtml(axis.formatDatum(value));
            return `<b>${nameString}</b>: ${valueString}`;
        };
        const title = undefined;
        const content =
            targetKey === undefined || targetValue === undefined
                ? makeLine(valueKey, valueName, valueValue)
                : `${makeLine(valueKey, valueName, valueValue)}<br/>${makeLine(targetKey, targetName, targetValue)}`;

        return this.tooltip.toTooltipHtml(
            { title, content },
            { datum, title, seriesId: this.id, valueKey, valueName, targetKey, targetName }
        );
    }

    protected override isLabelEnabled() {
        // TODO(olegat)
        return false;
    }
    protected override nodeFactory() {
        return new BulletNode();
    }

    protected override async updateDatumSelection(opts: {
        nodeData: BulletNodeDatum[];
        datumSelection: _Scene.Selection<BulletNode, BulletNodeDatum>;
    }) {
        return opts.datumSelection.update(opts.nodeData, undefined, undefined);
    }

    protected override async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<BulletNode, BulletNodeDatum>;
        isHighlight: boolean;
    }) {
        for (const { node, datum } of opts.datumSelection) {
            node.update(datum);
        }
    }

    private async updateColorRanges() {
        const valAxis = this.getValueAxis();
        const catAxis = this.getCategoryAxis();
        if (!valAxis || !catAxis) return;
        const [min, max] = [0, Math.max(...catAxis.scale.range)];
        const computeRect: (rect: _Scene.Rect, colorRange: NormalizedColorRange) => void =
            this.getBarDirection() === _ModuleSupport.ChartAxisDirection.Y
                ? (rect, colorRange) => {
                      rect.x = min;
                      rect.y = valAxis.scale.convert(colorRange.stop);
                      rect.height = valAxis.scale.convert(colorRange.start) - rect.y;
                      rect.width = max;
                  }
                : (rect, colorRange) => {
                      rect.x = valAxis.scale.convert(colorRange.start);
                      rect.y = min;
                      rect.height = max;
                      rect.width = valAxis.scale.convert(colorRange.stop) - rect.x;
                  };
        this.colorRangesSelection.update(this.normalizedColorRanges);
        for (const { node, datum } of this.colorRangesSelection) {
            computeRect(node, datum);
            node.fill = datum.color;
        }
    }

    protected override async updateNodes(
        highlightedItems: BulletNodeDatum[] | undefined,
        seriesHighlighted: boolean | undefined,
        anySeriesItemEnabled: boolean
    ) {
        super.updateNodes(highlightedItems, seriesHighlighted, anySeriesItemEnabled);
        await this.updateColorRanges();
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
