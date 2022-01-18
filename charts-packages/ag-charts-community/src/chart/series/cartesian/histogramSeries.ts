import { Group } from "../../../scene/group";
import { Selection } from "../../../scene/selection";
import { Rect } from "../../../scene/shape/rect";
import { Text, FontStyle, FontWeight } from "../../../scene/shape/text";
import { DropShadow } from "../../../scene/dropShadow";
import {
    SeriesNodeDatum,
    CartesianTooltipRendererParams as HistogramTooltipRendererParams, SeriesTooltip, Series
} from "../series";
import { Label } from "../../label";
import { PointerEvents } from "../../../scene/node";
import { LegendDatum } from "../../legend";
import { CartesianSeries } from "./cartesianSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { TooltipRendererResult, toTooltipHtml } from "../../chart";
import { extent } from "../../../util/array";
import { reactive, TypedEvent } from "../../../util/observable";
import ticks, { tickStep } from "../../../util/ticks";
import { sanitizeHtml } from "../../../util/sanitize";
import { isContinuous } from "../../../util/value";

enum HistogramSeriesNodeTag {
    Bin,
    Label
}

class HistogramSeriesLabel extends Label {
    @reactive('change') formatter?: (params: { value: number }) => string;
}

const defaultBinCount = 10;

export { HistogramTooltipRendererParams };

interface HistogramNodeDatum extends SeriesNodeDatum {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
    readonly label?: {
        readonly text: string;
        readonly x: number;
        readonly y: number;
        readonly fontStyle?: FontStyle;
        readonly fontWeight?: FontWeight;
        readonly fontSize: number;
        readonly fontFamily: string;
        readonly fill: string;
    };
}

export interface HistogramSeriesNodeClickEvent extends TypedEvent {
    readonly type: 'nodeClick';
    readonly event: MouseEvent;
    readonly series: HistogramSeries;
    readonly datum: any;
    readonly xKey: string;
}

export type HistogramAggregation = 'count' | 'sum' | 'mean';
type AggregationFunction = (bin: HistogramBin, yKey: string) => number;

const aggregationFunctions: { [key in HistogramAggregation]: AggregationFunction } = {
    count: bin => bin.data.length,
    sum: (bin, yKey) => bin.data.reduce((acc, datum) => acc + datum[yKey], 0),
    mean: (bin, yKey) => aggregationFunctions.sum(bin, yKey) / aggregationFunctions.count(bin, yKey)
};

export class HistogramBin {
    data: any[] = [];
    aggregatedValue: number = 0;
    frequency: number = 0;
    domain: [number, number];

    constructor([domainMin, domainMax]: [number, number]) {
        this.domain = [domainMin, domainMax];
    };

    addDatum(datum: any) {
        this.data.push(datum);
        this.frequency++;
    }

    get domainWidth(): number {
        const [domainMin, domainMax] = this.domain;
        return domainMax - domainMin;
    }

    get relativeHeight(): number {
        return this.aggregatedValue / this.domainWidth;
    }

    calculateAggregatedValue(aggregationName: HistogramAggregation, yKey: string) {
        if (!yKey) {
            // not having a yKey forces us into a frequency plot
            aggregationName = 'count';
        }

        const aggregationFunction = aggregationFunctions[aggregationName];

        this.aggregatedValue = aggregationFunction(this, yKey);
    }

    getY(areaPlot: boolean) {
        return areaPlot ? this.relativeHeight : this.aggregatedValue;
    }
}

export class HistogramSeriesTooltip extends SeriesTooltip {
    @reactive('change') renderer?: (params: HistogramTooltipRendererParams) => string | TooltipRendererResult;
}

export class HistogramSeries extends CartesianSeries {

    static className = 'HistogramSeries';
    static type = 'histogram' as const;

    // Need to put column and label nodes into separate groups, because even though label nodes are
    // created after the column nodes, this only guarantees that labels will always be on top of columns
    // on the first run. If on the next run more columns are added, they might clip the labels
    // rendered during the previous run.
    private rectGroup = this.pickGroup.appendChild(new Group());
    private textGroup = this.group.appendChild(new Group());

    private rectSelection: Selection<Rect, Group, any, any> = Selection.select(this.rectGroup).selectAll<Rect>();
    private textSelection: Selection<Text, Group, any, any> = Selection.select(this.textGroup).selectAll<Text>();

    private binnedData: HistogramBin[] = [];
    private xDomain: number[] = [];
    private yDomain: number[] = [];

    readonly label = new HistogramSeriesLabel();

    private seriesItemEnabled = true;

    tooltip: HistogramSeriesTooltip = new HistogramSeriesTooltip();

    @reactive('dataChange') fill: string | undefined = undefined;
    @reactive('dataChange') stroke: string | undefined = undefined;

    @reactive('layoutChange') fillOpacity = 1;
    @reactive('layoutChange') strokeOpacity = 1;

    @reactive('update') lineDash?: number[] = [0];
    @reactive('update') lineDashOffset: number = 0;

    constructor() {
        super();

        this.label.enabled = false;
        this.label.addEventListener('change', this.scheduleUpdate, this);
    }

    directionKeys = {
        [ChartAxisDirection.X]: ['xKey'],
        [ChartAxisDirection.Y]: ['yKey']
    };

    getKeys(direction: ChartAxisDirection): string[] {
        const { directionKeys } = this;
        const keys = directionKeys && directionKeys[direction];
        const values: string[] = [];

        if (keys) {
            keys.forEach(key => {
                const value = (this as any)[key];

                if (value) {
                    if (Array.isArray(value)) {
                        values.push(...value);
                    } else {
                        values.push(value);
                    }
                }
            });
        }

        return values;
    }

    protected _xKey: string = '';
    set xKey(value: string) {
        if (this._xKey !== value) {
            this._xKey = value;
            this.scheduleData();
        }
    }

    get xKey(): string {
        return this._xKey;
    }

    private _areaPlot: boolean = false;
    set areaPlot(c: boolean) {
        this._areaPlot = c;

        this.scheduleData();
    }

    get areaPlot(): boolean {
        return this._areaPlot;
    }

    private _bins: [number, number][] | undefined = undefined;
    set bins(bins: [number, number][] | undefined) {
        this._bins = bins;

        this.scheduleData();
    }

    get bins(): [number, number][] | undefined {
        return this._bins;
    }

    private _aggregation: HistogramAggregation = 'count';
    set aggregation(aggregation: HistogramAggregation) {
        this._aggregation = aggregation;

        this.scheduleData();
    }

    get aggregation(): HistogramAggregation {
        return this._aggregation;
    }

    private _binCount: number | undefined = undefined;
    set binCount(binCount: number | undefined) {
        this._binCount = binCount;

        this.scheduleData();
    }

    get binCount(): number | undefined {
        return this._binCount;
    }

    protected _xName: string = '';
    set xName(value: string) {
        if (this._xName !== value) {
            this._xName = value;
            this.scheduleUpdate();
        }
    }

    get xName(): string {
        return this._xName;
    }

    protected _yKey: string = '';
    set yKey(yKey: string) {
        this._yKey = yKey;
        this.seriesItemEnabled = true;
        this.scheduleData();
    }

    get yKey(): string {
        return this._yKey;
    }

    protected _yName: string = '';
    set yName(values: string) {
        this._yName = values;
        this.scheduleData();
    }

    get yName(): string {
        return this._yName;
    }

    private _strokeWidth: number = 1;
    set strokeWidth(value: number) {
        if (this._strokeWidth !== value) {
            this._strokeWidth = value;
            this.scheduleUpdate();
        }
    }

    get strokeWidth(): number {
        return this._strokeWidth;
    }

    private _shadow?: DropShadow;
    set shadow(value: DropShadow | undefined) {
        if (this._shadow !== value) {
            this._shadow = value;
            this.scheduleUpdate();
        }
    }

    get shadow(): DropShadow | undefined {
        return this._shadow;
    }

    onHighlightChange() {
        this.updateRectNodes();
    }

    setColors(fills: string[], strokes: string[]) {
        this.fill = fills[0];
        this.stroke = strokes[0];
    }

    protected highlightedDatum?: HistogramNodeDatum;

    // During processData phase, used to unify different ways of the user specifying
    // the bins. Returns bins in format[[min1, max1], [min2, max2], ... ].
    private deriveBins(): [number, number][] {
        const { bins, binCount } = this;

        if (!this.data) {
            return [];
        }

        if (bins) {
            return bins;
        }

        const xData = this.data.map(datum => datum[this.xKey]);
        const xDomain = this.fixNumericExtent(extent(xData, isContinuous), 'x');

        const binStarts = ticks(xDomain[0], xDomain[1], this.binCount || defaultBinCount);
        const binSize = tickStep(xDomain[0], xDomain[1], this.binCount || defaultBinCount);
        const firstBinEnd = binStarts[0];

        const expandStartToBin: (n: number) => [number, number] = n => [n, n + binSize];

        return [
            [firstBinEnd - binSize, firstBinEnd],
            ...binStarts.map(expandStartToBin)
        ];
    }

    private placeDataInBins(data: any[]): HistogramBin[] {

        const { xKey } = this;
        const derivedBins = this.deriveBins();

        // creating a sorted copy allows binning in O(n) rather than O(n²)
        // but at the expense of more temporary memory
        const sortedData = data.slice().sort((a, b) => {
            if (a[xKey] < b[xKey]) {
                return -1;
            }
            if (a[xKey] > b[xKey]) {
                return 1;
            }
            return 0;
        });

        let currentBin = 0;
        const bins: HistogramBin[] = [new HistogramBin(derivedBins[0])];

        loop: for (let i = 0, ln = sortedData.length; i < ln; i++) {
            const datum = sortedData[i];
            while (datum[xKey] > derivedBins[currentBin][1]) {
                currentBin++;
                const bin = derivedBins[currentBin];
                if (!bin) {
                    break loop;
                }
                bins.push(new HistogramBin(bin));
            }
            bins[currentBin].addDatum(datum);
        }

        bins.forEach(b => b.calculateAggregatedValue(this._aggregation, this.yKey));

        return bins;
    }

    get xMax(): number {
        return this.data && this.data.reduce((acc, datum) => {
            return Math.max(acc, datum[this.xKey]);
        }, Number.NEGATIVE_INFINITY);
    }

    processData(): boolean {
        const { xKey, data } = this;

        this.binnedData = this.placeDataInBins(xKey && data ? data : []);

        const yData = this.binnedData.map(b => b.getY(this.areaPlot));
        const yMinMax = extent(yData, isContinuous);

        this.yDomain = this.fixNumericExtent([0, yMinMax ? yMinMax[1] : 1], 'y');

        const firstBin = this.binnedData[0];
        const lastBin = this.binnedData[this.binnedData.length - 1];
        const xMin = firstBin.domain[0];
        const xMax = lastBin.domain[1];
        this.xDomain = [xMin, xMax];

        this.fireEvent({ type: 'dataProcessed' });

        return true;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.xDomain;
        } else {
            return this.yDomain;
        }
    }

    fireNodeClickEvent(event: MouseEvent, datum: HistogramNodeDatum): void {
        this.fireEvent<HistogramSeriesNodeClickEvent>({
            type: 'nodeClick',
            event,
            series: this,
            datum: datum.datum,
            xKey: this.xKey
        });
    }

    update(): void {
        this.updatePending = false;

        this.updateSelections();
        this.updateNodes();
    }

    updateSelections() {
        if (!this.nodeDataPending) {
            return;
        }
        this.nodeDataPending = false;

        const nodeData = this.createNodeData();

        this.updateRectSelection(nodeData);
        this.updateTextSelection(nodeData);
    }

    updateNodes() {
        this.group.visible = this.visible;
        this.updateRectNodes();
        this.updateTextNodes();
    }

    createNodeData(): HistogramNodeDatum[] {
        const { xAxis, yAxis } = this;

        if (!this.seriesItemEnabled || !xAxis || !yAxis) {
            return [];
        }

        const { scale: xScale } = xAxis;
        const { scale: yScale } = yAxis;
        const { fill, stroke, strokeWidth } = this;

        const nodeData: HistogramNodeDatum[] = [];

        const defaultLabelFormatter = (params: { value: number }) => String(params.value);
        const {
            label: {
                formatter: labelFormatter = defaultLabelFormatter,
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                color: labelColor
            }
        } = this;

        this.binnedData.forEach(binOfData => {
            const { aggregatedValue: total, frequency, domain: [xDomainMin, xDomainMax], relativeHeight } = binOfData;

            const
                xMinPx = xScale.convert(xDomainMin),
                xMaxPx = xScale.convert(xDomainMax),
                // note: assuming can't be negative:
                y = this.areaPlot ? relativeHeight : (this.yKey ? total : frequency),
                yZeroPx = yScale.convert(0),
                yMaxPx = yScale.convert(y),
                w = xMaxPx - xMinPx,
                h = Math.abs(yMaxPx - yZeroPx);

            const selectionDatumLabel = y !== 0 ? {
                text: labelFormatter({ value: binOfData.aggregatedValue }),
                fontStyle: labelFontStyle,
                fontWeight: labelFontWeight,
                fontSize: labelFontSize,
                fontFamily: labelFontFamily,
                fill: labelColor,
                x: xMinPx + w / 2,
                y: yMaxPx + h / 2
            } : undefined;

            nodeData.push({
                series: this,
                datum: binOfData,  // required by SeriesNodeDatum, but might not make sense here
                                   // since each selection is an aggregation of multiple data.
                x: xMinPx,
                y: yMaxPx,
                width: w,
                height: h,
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                label: selectionDatumLabel,
            });
        });

        return nodeData;
    }

    private updateRectSelection(nodeData: HistogramNodeDatum[]): void {
        const updateRects = this.rectSelection.setData(nodeData);
        updateRects.exit.remove();

        const enterRects = updateRects.enter.append(Rect).each(rect => {
            rect.tag = HistogramSeriesNodeTag.Bin;
            rect.crisp = true;
        });

        this.rectSelection = updateRects.merge(enterRects);
    }

    private updateRectNodes(): void {
        if (!this.chart) {
            return;
        }

        const {
            fillOpacity, strokeOpacity, shadow,
            chart: { highlightedDatum },
            highlightStyle: {
                fill: deprecatedFill,
                stroke: deprecatedStroke,
                strokeWidth: deprecatedStrokeWidth,
                item: {
                    fill: highlightedFill = deprecatedFill,
                    stroke: highlightedStroke = deprecatedStroke,
                    strokeWidth: highlightedDatumStrokeWidth = deprecatedStrokeWidth,
                }
            }
        } = this;

        this.rectSelection.each((rect, datum, index) => {
            const isDatumHighlighted = datum === highlightedDatum;
            const strokeWidth = isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                ? highlightedDatumStrokeWidth
                : this.getStrokeWidth(datum.strokeWidth, datum);

            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
            rect.fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill;
            rect.stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : datum.stroke;
            rect.fillOpacity = fillOpacity;
            rect.strokeOpacity = strokeOpacity;
            rect.strokeWidth = strokeWidth;
            rect.lineDash = this.lineDash;
            rect.lineDashOffset = this.lineDashOffset;
            rect.fillShadow = shadow;
            rect.zIndex = isDatumHighlighted ? Series.highlightedZIndex : index;
            rect.visible = datum.height > 0; // prevent stroke from rendering for zero height columns
            rect.opacity = this.getOpacity(datum);
        });
    }


    private updateTextSelection(nodeData: HistogramNodeDatum[]): void {
        const updateTexts = this.textSelection.setData(nodeData);
        updateTexts.exit.remove();

        const enterTexts = updateTexts.enter.append(Text).each(text => {
            text.tag = HistogramSeriesNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            text.textAlign = 'center';
            text.textBaseline = 'middle';
        });

        this.textSelection = updateTexts.merge(enterTexts);
    }

    private updateTextNodes(): void {
        const labelEnabled = this.label.enabled;

        this.textSelection.each((text, datum) => {
            const label = datum.label;

            if (label && labelEnabled) {
                text.text = label.text;
                text.x = label.x;
                text.y = label.y;
                text.fontStyle = label.fontStyle;
                text.fontWeight = label.fontWeight;
                text.fontSize = label.fontSize;
                text.fontFamily = label.fontFamily;
                text.fill = label.fill;
                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: HistogramNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !xAxis || !yAxis) {
            return '';
        }

        const { xName, yName, fill: color, tooltip, aggregation } = this;
        const { renderer: tooltipRenderer } = tooltip;
        const bin: HistogramBin = nodeDatum.datum;
        const { aggregatedValue, frequency, domain: [rangeMin, rangeMax] } = bin;
        const title = `${sanitizeHtml(xName || xKey)}: ${xAxis.formatDatum(rangeMin)} - ${xAxis.formatDatum(rangeMax)}`;
        let content = yKey ?
            `<b>${sanitizeHtml(yName || yKey)} (${aggregation})</b>: ${yAxis.formatDatum(aggregatedValue)}<br>` :
            '';

        content += `<b>Frequency</b>: ${frequency}`;

        const defaults: TooltipRendererResult = {
            title,
            backgroundColor: color,
            content
        };

        if (tooltipRenderer) {
            return toTooltipHtml(tooltipRenderer({
                datum: bin,
                xKey,
                xValue: bin.domain,
                xName,
                yKey,
                yValue: bin.aggregatedValue,
                yName,
                color
            }), defaults);
        }

        return toTooltipHtml(defaults);
    }

    listSeriesItems(legendData: LegendDatum[]): void {
        const {
            id, data, yKey, yName, seriesItemEnabled,
            fill, stroke, fillOpacity, strokeOpacity
        } = this;

        if (data && data.length) {
            legendData.push({
                id,
                itemId: yKey,
                enabled: seriesItemEnabled,
                label: {
                    text: yName || yKey || 'Frequency'
                },
                marker: {
                    fill: fill || 'rgba(0, 0, 0, 0)',
                    stroke: stroke || 'rgba(0, 0, 0, 0)',
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity
                }
            });
        }
    }

    toggleSeriesItem(itemId: string, enabled: boolean): void {
        if (itemId === this.yKey) {
            this.seriesItemEnabled = enabled;
        }
        this.scheduleData();
    }
}
