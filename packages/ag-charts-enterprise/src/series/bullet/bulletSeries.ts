import type { AgBarSeriesStyle, AgBulletSeriesTooltipRendererParams } from 'ag-charts-community';
import { _ModuleSupport, _Scale, _Scene, _Util } from 'ag-charts-community';

const {
    keyProperty,
    partialAssign,
    valueProperty,
    Validate,
    COLOR_STRING,
    STRING,
    LINE_DASH,
    NUMBER,
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

const STYLING_KEYS: (keyof _Scene.Shape)[] = [
    'fill',
    'fillOpacity',
    'stroke',
    'strokeWidth',
    'strokeOpacity',
    'lineDash',
    'lineDashOffset',
];

class BulletNode extends _Scene.Group {
    private valueRect: _Scene.Rect = new _Scene.Rect();
    private targetLine: _Scene.Line = new _Scene.Line();

    public constructor() {
        super();
        this.append(this.valueRect);
        this.append(this.targetLine);
    }

    public update(datum: BulletNodeDatum, valueStyle: AgBarSeriesStyle, targetStyle: AgBarSeriesStyle) {
        partialAssign(['x', 'y', 'height', 'width'], this.valueRect, datum);
        partialAssign(STYLING_KEYS, this.valueRect, valueStyle);

        partialAssign(['x1', 'x2', 'y1', 'y2'], this.targetLine, datum.target);
        partialAssign(STYLING_KEYS, this.targetLine, targetStyle);
    }
}

class TargetStyle {
    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(NUMBER(0))
    strokeWidth = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;
}

class BulletScale {
    @Validate(OPT_NUMBER(0))
    max?: number = undefined;
}

export class BulletSeries extends _ModuleSupport.AbstractBarSeries<BulletNode, BulletNodeDatum> {
    @Validate(COLOR_STRING)
    fill: string = 'black';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(COLOR_STRING)
    stroke: string = 'black';

    @Validate(NUMBER(0))
    strokeWidth = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(LINE_DASH)
    lineDash: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    target: TargetStyle = new TargetStyle();

    @Validate(STRING)
    valueKey: string = '';

    @Validate(OPT_STRING)
    valueName?: string = undefined;

    @Validate(OPT_STRING)
    targetKey?: string = undefined;

    @Validate(OPT_STRING)
    targetName?: string = undefined;

    @Validate(OPT_ARRAY())
    colorRanges?: BulletColorRange[] = undefined;

    scale: BulletScale = new BulletScale();

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

        // Bullet graphs only need 1 datum, but we keep that `data` option as array for consistency with other series
        // types and future compatibility (we may decide to support multiple datums at some point).
        await this.requestDataModel<any, any, true>(dataController, data.slice(0, 1), {
            props,
            groupByKeys: true,
            dataVisible: this.visible,
        });
    }

    private getMaxValue(): number {
        const { dataModel, processedData, targetKey, scale } = this;
        if (scale.max !== undefined) {
            return scale.max;
        }
        if (!dataModel || !processedData) {
            return NaN;
        }

        const valueDomain = dataModel.getDomain(this, 'value', 'value', processedData);
        const targetDomain = targetKey === undefined ? [] : dataModel.getDomain(this, 'target', 'value', processedData);

        return Math.max(...valueDomain, ...targetDomain);
    }

    override getSeriesDomain(direction: _ModuleSupport.ChartAxisDirection) {
        if (direction === this.getCategoryDirection()) {
            return [this.valueName ?? this.valueKey];
        } else if (direction == this.getValueAxis()?.direction) {
            return [0, this.getMaxValue()];
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

        const maxValue = this.getMaxValue();
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
            const yValue = Math.min(maxValue, values[0][valueIndex]);
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
                const targetValue = Math.min(maxValue, values[0][targetIndex]);
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
            const sortedRanges = [...this.colorRanges].sort((a, b) => (a.stop || maxValue) - (b.stop || maxValue));
            let start = 0;
            this.normalizedColorRanges = sortedRanges.map((item) => {
                const stop = Math.min(maxValue, item.stop ?? Infinity);
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
            node.update(datum, this, this.target);
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
}
