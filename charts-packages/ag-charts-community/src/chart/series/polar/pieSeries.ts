import { Group } from "../../../scene/group";
import { Line } from "../../../scene/shape/line";
import { Text } from "../../../scene/shape/text";
import { Selection } from "../../../scene/selection";
import { DropShadow } from "../../../scene/dropShadow";
import { LinearScale } from "../../../scale/linearScale";
import { Sector } from "../../../scene/shape/sector";
import { PolarTooltipRendererParams, SeriesNodeDatum, HighlightStyle } from "./../series";
import { Label } from "../../label";
import { PointerEvents } from "../../../scene/node";
import { normalizeAngle180, toRadians } from "../../../util/angle";
import { Color } from "../../../util/color";
import { toFixed } from "../../../util/number";
import { LegendDatum } from "../../legend";
import { Caption } from "../../../caption";
import { reactive, Observable, TypedEvent } from "../../../util/observable";
import { PolarSeries } from "./polarSeries";
import { ChartAxisDirection } from "../../chartAxis";
import { Chart } from "../../chart";

export interface PieSeriesNodeClickEvent extends TypedEvent {
    type: 'nodeClick';
    series: PieSeries;
    datum: any;
    angleKey: string;
    radiusKey?: string;
}

interface PieNodeDatum extends SeriesNodeDatum {
    index: number;
    radius: number; // in the [0, 1] range
    startAngle: number;
    endAngle: number;
    midAngle: number;
    midCos: number;
    midSin: number;

    label?: {
        text: string,
        textAlign: CanvasTextAlign,
        textBaseline: CanvasTextBaseline
    };
}

export interface PieTooltipRendererParams extends PolarTooltipRendererParams {
    labelKey?: string;
    labelName?: string;
}

interface PieHighlightStyle extends HighlightStyle {
    centerOffset?: number;
}

enum PieNodeTag {
    Sector,
    Callout,
    Label
}

class PieSeriesLabel extends Label {
    @reactive('change') offset = 3; // from the callout line
    @reactive('dataChange') minAngle = 20; // in degrees
}

class PieSeriesCallout extends Observable {
    @reactive('change') colors: string[] = [];
    @reactive('change') length: number = 10;
    @reactive('change') strokeWidth: number = 1;
}

export class PieSeries extends PolarSeries {

    static className = 'PieSeries';
    static type = 'pie';

    private radiusScale: LinearScale = new LinearScale();
    private groupSelection: Selection<Group, Group, PieNodeDatum, any> = Selection.select(this.group).selectAll<Group>();

    /**
     * The processed data that gets visualized.
     */
    private groupSelectionData: PieNodeDatum[] = [];

    private angleScale: LinearScale = (() => {
        const scale = new LinearScale();
        // Each slice is a ratio of the whole, where all ratios add up to 1.
        scale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        scale.range = [-Math.PI, Math.PI].map(angle => angle + Math.PI / 2);
        return scale;
    })();

    // When a user toggles a series item (e.g. from the legend), its boolean state is recorded here.
    public seriesItemEnabled: boolean[] = [];

    private _title?: Caption;
    set title(value: Caption | undefined) {
        const oldTitle = this._title;

        if (oldTitle !== value) {
            if (oldTitle) {
                oldTitle.removeEventListener('change', this.scheduleLayout);
                this.group.removeChild(oldTitle.node);
            }

            if (value) {
                value.node.textBaseline = 'bottom';
                value.addEventListener('change', this.scheduleLayout);
                this.group.appendChild(value.node);
            }

            this._title = value;
            this.scheduleLayout();
        }
    }
    get title(): Caption | undefined {
        return this._title;
    }

    readonly label = new PieSeriesLabel();
    readonly callout = new PieSeriesCallout();

    constructor() {
        super();

        this.addEventListener('update', this.update, this);
        this.label.addEventListener('change', this.scheduleLayout, this);
        this.label.addEventListener('dataChange', this.scheduleData, this);
        this.callout.addEventListener('change', this.scheduleLayout, this);

        this.addPropertyListener('data', event => {
            event.source.seriesItemEnabled = event.value.map(() => true);
        });
    }

    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie slice angle).
     */
    @reactive('dataChange') angleKey = '';
    @reactive('update') angleName = '';

    /**
     * The key of the numeric field to use to determine the radii of pie slices.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii. To prevent confusing visuals, this config only works
     * if {@link innerRadiusOffset} is zero.
     */
    @reactive('dataChange') radiusKey?: string;
    @reactive('update') radiusName?: string;

    @reactive('dataChange') labelKey?: string;
    @reactive('update') labelName?: string;

    private _fills: string[] = [];
    set fills(values: string[]) {
        this._fills = values;
        this.strokes = values.map(color => Color.fromString(color).darker().toHexString());
        this.scheduleData();
    }
    get fills(): string[] {
        return this._fills;
    }

    private _strokes: string[] = [];
    set strokes(values: string[]) {
        this._strokes = values;
        this.callout.colors = values;
        this.scheduleData();
    }
    get strokes(): string[] {
        return this._strokes;
    }

    @reactive('layoutChange') fillOpacity = 1;
    @reactive('layoutChange') strokeOpacity = 1;

    /**
     * The series rotation in degrees.
     */
    @reactive('dataChange') rotation = 0;

    @reactive('layoutChange') outerRadiusOffset = 0;

    @reactive('dataChange') innerRadiusOffset = 0;

    @reactive('layoutChange') strokeWidth = 1;

    @reactive('layoutChange') shadow?: DropShadow;

    highlightStyle: PieHighlightStyle = { fill: 'yellow' };

    onHighlightChange() {
        this.updateNodes();
    }

    get colorCount(): number {
        return Infinity;
    }

    setColors(fills: string[], strokes: string[]) {
        this.fills = fills;
        this.strokes = strokes;
        this.callout.colors = strokes;
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.angleScale.domain;
        } else {
            return this.radiusScale.domain;
        }
    }

    processData(): boolean {
        const { angleKey, radiusKey, seriesItemEnabled, angleScale, groupSelectionData } = this;
        const data = angleKey && this.data ? this.data : [];

        const angleData: number[] = data.map((datum, index) => seriesItemEnabled[index] && Math.abs(+datum[angleKey]) || 0);
        const angleDataTotal = angleData.reduce((a, b) => a + b, 0);

        // The ratios (in [0, 1] interval) used to calculate the end angle value for every pie slice.
        // Each slice starts where the previous one ends, so we only keep the ratios for end angles.
        const angleDataRatios = (() => {
            let sum = 0;
            return angleData.map(datum => sum += datum / angleDataTotal);
        })();

        const labelKey = this.label.enabled && this.labelKey;
        const labelData = labelKey ? data.map(datum => String(datum[labelKey])) : [];
        const useRadiusKey = !!radiusKey && !this.innerRadiusOffset;
        let radiusData: number[] = [];

        if (useRadiusKey) {
            const radii = data.map(datum => Math.abs(datum[radiusKey!]));
            const maxDatum = Math.max(...radii);

            radiusData = radii.map(value => value / maxDatum);
        }

        groupSelectionData.length = 0;

        const rotation = toRadians(this.rotation);
        const halfPi = Math.PI / 2;

        let datumIndex = 0;

        // Simply use reduce here to pair up adjacent ratios.
        angleDataRatios.reduce((start, end) => {
            const radius = useRadiusKey ? radiusData[datumIndex] : 1;
            const startAngle = angleScale.convert(start) + rotation;
            const endAngle = angleScale.convert(end) + rotation;

            const midAngle = (startAngle + endAngle) / 2;
            const span = Math.abs(endAngle - startAngle);
            const midCos = Math.cos(midAngle);
            const midSin = Math.sin(midAngle);

            const labelMinAngle = toRadians(this.label.minAngle);
            const labelVisible = labelKey && span > labelMinAngle;
            const midAngle180 = normalizeAngle180(midAngle);

            // Split the circle into quadrants like so: ⊗
            let quadrantStart = -3 * Math.PI / 4; // same as `normalizeAngle180(toRadians(-135))`
            let textAlign: CanvasTextAlign;
            let textBaseline: CanvasTextBaseline;

            if (midAngle180 >= quadrantStart && midAngle180 < (quadrantStart += halfPi)) {
                textAlign = 'center';
                textBaseline = 'bottom';
            } else if (midAngle180 >= quadrantStart && midAngle180 < (quadrantStart += halfPi)) {
                textAlign = 'left';
                textBaseline = 'middle';
            } else if (midAngle180 >= quadrantStart && midAngle180 < (quadrantStart += halfPi)) {
                textAlign = 'center';
                textBaseline = 'hanging';
            } else {
                textAlign = 'right';
                textBaseline = 'middle';
            }

            groupSelectionData.push({
                series: this,
                seriesDatum: data[datumIndex],
                index: datumIndex,
                radius,
                startAngle,
                endAngle,
                midAngle,
                midCos,
                midSin,
                label: labelVisible ? {
                    text: labelData[datumIndex],
                    textAlign,
                    textBaseline
                } : undefined
            });

            datumIndex++;

            return end;
        }, 0);

        return true;
    }

    update(): void {
        const { chart } = this;
        const visible = this.group.visible = this.visible && this.seriesItemEnabled.indexOf(true) >= 0;

        if (!visible || !chart || chart.dataPending || chart.layoutPending) {
            return;
        }

        this.radiusScale.range = [0, this.radius];

        this.group.translationX = this.centerX;
        this.group.translationY = this.centerY;


        const { title } = this;
        if (title) {
            title.node.translationY = -this.radius - this.outerRadiusOffset - 2;
            title.node.visible = title.enabled;
        }

        this.updateGroupSelection();
        this.updateNodes();
    }

    private updateGroupSelection() {
        const updateGroups = this.groupSelection.setData(this.groupSelectionData);
        updateGroups.exit.remove();

        const enterGroups = updateGroups.enter.append(Group);
        enterGroups.append(Sector).each(node => node.tag = PieNodeTag.Sector);
        enterGroups.append(Line).each(node => {
            node.tag = PieNodeTag.Callout;
            node.pointerEvents = PointerEvents.None;
        });
        enterGroups.append(Text).each(node => {
            node.tag = PieNodeTag.Label;
            node.pointerEvents = PointerEvents.None;
        });

        this.groupSelection = updateGroups.merge(enterGroups);
    }

    private updateNodes() {
        const {
            fills, strokes, fillOpacity, strokeOpacity, strokeWidth,
            outerRadiusOffset, innerRadiusOffset,
            radiusScale, callout, shadow,
            highlightStyle: { fill, stroke, centerOffset }
        } = this;
        const { highlightedDatum } = this.chart;

        let minOuterRadius = Infinity;
        const outerRadii: number[] = [];
        const centerOffsets: number[] = [];

        this.groupSelection.selectByTag<Sector>(PieNodeTag.Sector).each((sector, datum, index) => {
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius + outerRadiusOffset);

            if (minOuterRadius > outerRadius) {
                minOuterRadius = outerRadius;
            }

            sector.outerRadius = outerRadius;
            sector.innerRadius = Math.max(0, innerRadiusOffset ? radius + innerRadiusOffset : 0);
            sector.startAngle = datum.startAngle;
            sector.endAngle = datum.endAngle;

            const highlighted = datum === highlightedDatum;
            sector.fill = highlighted && fill !== undefined ? fill : fills[index % fills.length];
            sector.stroke = highlighted && stroke !== undefined ? stroke : strokes[index % strokes.length];
            sector.fillOpacity = fillOpacity;
            sector.strokeOpacity = strokeOpacity;
            sector.centerOffset = highlighted && centerOffset !== undefined ? centerOffset : 0;
            sector.fillShadow = shadow;
            sector.strokeWidth = strokeWidth;
            sector.lineJoin = 'round';

            outerRadii.push(outerRadius);
            centerOffsets.push(sector.centerOffset);
        });

        const { colors: calloutColors, length: calloutLength, strokeWidth: calloutStrokeWidth } = callout;

        this.groupSelection.selectByTag<Line>(PieNodeTag.Callout).each((line, datum, index) => {
            if (datum.label) {
                const outerRadius = centerOffsets[index] + outerRadii[index];

                line.strokeWidth = calloutStrokeWidth;
                line.stroke = calloutColors[index % calloutColors.length];
                line.x1 = datum.midCos * outerRadius;
                line.y1 = datum.midSin * outerRadius;
                line.x2 = datum.midCos * (outerRadius + calloutLength);
                line.y2 = datum.midSin * (outerRadius + calloutLength);
            } else {
                line.stroke = undefined;
            }
        });

        {
            const { offset, fontStyle, fontWeight, fontSize, fontFamily, color } = this.label;

            this.groupSelection.selectByTag<Text>(PieNodeTag.Label).each((text, datum, index) => {
                const label = datum.label;

                if (label) {
                    const outerRadius = outerRadii[index];
                    const labelRadius = centerOffsets[index] + outerRadius + calloutLength + offset;

                    text.fontStyle = fontStyle;
                    text.fontWeight = fontWeight;
                    text.fontSize = fontSize;
                    text.fontFamily = fontFamily;
                    text.text = label.text;
                    text.x = datum.midCos * labelRadius;
                    text.y = datum.midSin * labelRadius;
                    text.fill = color;
                    text.textAlign = label.textAlign;
                    text.textBaseline = label.textBaseline;
                } else {
                    text.fill = undefined;
                }
            });
        }
    }

    fireNodeClickEvent(datum: PieNodeDatum): void {
        this.fireEvent<PieSeriesNodeClickEvent>({
            type: 'nodeClick',
            series: this,
            datum: datum.seriesDatum,
            angleKey: this.angleKey,
            radiusKey: this.radiusKey
        });
    }

    getTooltipHtml(nodeDatum: PieNodeDatum): string {
        const { angleKey } = this;

        if (!angleKey) {
            return '';
        }

        const {
            title,
            fills,
            tooltipRenderer,
            angleName,
            radiusKey,
            radiusName,
            labelKey,
            labelName,
        } = this;

        const text = title ? title.text : undefined;
        const color = fills[nodeDatum.index % fills.length];

        if (tooltipRenderer) {
            return tooltipRenderer({
                datum: nodeDatum.seriesDatum,
                angleKey,
                angleName,
                radiusKey,
                radiusName,
                labelKey,
                labelName,
                title: text,
                color,
            });
        } else {
            const titleStyle = `style="color: white; background-color: ${color}"`;
            const titleString = title ? `<div class="${Chart.defaultTooltipClass}-title" ${titleStyle}>${text}</div>` : '';
            const label = labelKey ? `${nodeDatum.seriesDatum[labelKey]}: ` : '';
            const value = nodeDatum.seriesDatum[angleKey];
            const formattedValue = typeof value === 'number' ? toFixed(value) : value.toString();

            return `${titleString}<div class="${Chart.defaultTooltipClass}-content">${label}${formattedValue}</div>`;
        }
    }

    tooltipRenderer?: (params: PieTooltipRendererParams) => string;

    listSeriesItems(legendData: LegendDatum[]): void {
        const { labelKey, data } = this;

        if (data && data.length && labelKey) {
            const { fills, strokes, id } = this;

            data.forEach((datum, index) => {
                legendData.push({
                    id,
                    itemId: index,
                    enabled: this.seriesItemEnabled[index],
                    label: {
                        text: String(datum[labelKey])
                    },
                    marker: {
                        fill: fills[index % fills.length],
                        stroke: strokes[index % strokes.length],
                        fillOpacity: this.fillOpacity,
                        strokeOpacity: this.strokeOpacity
                    }
                });
            });
        }
    }

    toggleSeriesItem(itemId: number, enabled: boolean): void {
        this.seriesItemEnabled[itemId] = enabled;
        this.scheduleData();
    }
}
