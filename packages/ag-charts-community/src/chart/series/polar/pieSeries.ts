import { Group } from '../../../scene/group';
import { Line } from '../../../scene/shape/line';
import { Text } from '../../../scene/shape/text';
import { Circle } from '../../marker/circle';
import { Selection } from '../../../scene/selection';
import { DropShadow } from '../../../scene/dropShadow';
import { LinearScale } from '../../../scale/linearScale';
import { Sector } from '../../../scene/shape/sector';
import { BBox } from '../../../scene/bbox';
import { SeriesNodeDatum, HighlightStyle, SeriesTooltip, SeriesNodeBaseClickEvent } from './../series';
import { Label } from '../../label';
import { PointerEvents } from '../../../scene/node';
import { normalizeAngle180, toRadians } from '../../../util/angle';
import { toFixed, mod } from '../../../util/number';
import { Layers } from '../../layers';
import { ChartLegendDatum, CategoryLegendDatum } from '../../legendDatum';
import { Caption } from '../../../caption';
import { PolarSeries } from './polarSeries';
import { ChartAxisDirection } from '../../chartAxisDirection';
import { toTooltipHtml } from '../../tooltip/tooltip';
import { isPointInSector, boxCollidesSector } from '../../../util/sector';
import {
    BOOLEAN,
    NUMBER,
    OPT_FUNCTION,
    OPT_LINE_DASH,
    OPT_NUMBER,
    OPT_STRING,
    STRING,
    COLOR_STRING_ARRAY,
    OPT_COLOR_STRING_ARRAY,
    Validate,
    COLOR_STRING,
} from '../../../util/validation';
import {
    AgPieSeriesLabelFormatterParams,
    AgPieSeriesTooltipRendererParams,
    AgTooltipRendererResult,
    AgPieSeriesFormat,
    AgPieSeriesFormatterParams,
} from '../../agChartOptions';
import { LegendItemClickChartEvent, LegendItemDoubleClickChartEvent } from '../../interaction/chartEventManager';
import { StateMachine } from '../../../motion/states';
import * as easing from '../../../motion/easing';

class PieSeriesNodeBaseClickEvent extends SeriesNodeBaseClickEvent<any> {
    readonly angleKey: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    readonly radiusKey?: string;

    constructor(
        angleKey: string,
        calloutLabelKey: string | undefined,
        sectorLabelKey: string | undefined,
        radiusKey: string | undefined,
        nativeEvent: MouseEvent,
        datum: PieNodeDatum,
        series: PieSeries
    ) {
        super(nativeEvent, datum, series);
        this.angleKey = angleKey;
        this.calloutLabelKey = calloutLabelKey;
        this.sectorLabelKey = sectorLabelKey;
        this.radiusKey = radiusKey;
    }
}

class PieSeriesNodeClickEvent extends PieSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

class PieSeriesNodeDoubleClickEvent extends PieSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

interface PieNodeDatum extends SeriesNodeDatum {
    readonly index: number;
    readonly radius: number; // in the [0, 1] range
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly midCos: number;
    readonly midSin: number;

    readonly calloutLabel?: {
        readonly text: string;
        readonly textAlign: CanvasTextAlign;
        readonly textBaseline: CanvasTextBaseline;
        hidden: boolean;
        collisionTextAlign?: CanvasTextAlign;
        collisionOffsetY: number;
        box?: BBox;
    };

    readonly sectorLabel?: {
        readonly text: string;
    };

    readonly sectorFormat: AgPieSeriesFormat;
}

enum PieNodeTag {
    Sector,
    Callout,
    Label,
}

class PieSeriesCalloutLabel extends Label {
    @Validate(NUMBER(0))
    offset = 3; // from the callout line

    @Validate(NUMBER(0))
    minAngle = 0; // in degrees

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgPieSeriesLabelFormatterParams<any>) => string = undefined;

    @Validate(NUMBER(0))
    minSpacing = 4;

    @Validate(NUMBER(0))
    maxCollisionOffset = 50;
}

class PieSeriesSectorLabel extends Label {
    @Validate(NUMBER())
    positionOffset = 0;

    @Validate(NUMBER(0, 1))
    positionRatio = 0.5;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgPieSeriesLabelFormatterParams<any>) => string = undefined;
}

class PieSeriesCalloutLine {
    @Validate(OPT_COLOR_STRING_ARRAY)
    colors: string[] | undefined = undefined;

    @Validate(NUMBER(0))
    length: number = 10;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;
}

class PieSeriesTooltip extends SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgPieSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

export class PieTitle extends Caption {
    @Validate(BOOLEAN)
    showInLegend = false;
}

export class DoughnutInnerLabel extends Label {
    @Validate(STRING)
    text = '';
    @Validate(NUMBER())
    margin = 2;
}

export class DoughnutInnerCircle {
    @Validate(COLOR_STRING)
    fill = 'transparent';
    @Validate(OPT_NUMBER(0, 1))
    fillOpacity? = 1;
}

type PieAnimationState = 'empty' | 'ready';
type PieAnimationEvent = 'load';
class PieStateMachine extends StateMachine<PieAnimationState, PieAnimationEvent> {}

export class PieSeries extends PolarSeries<PieNodeDatum> {
    static className = 'PieSeries';
    static type = 'pie' as const;

    private radiusScale: LinearScale = new LinearScale();
    private groupSelection: Selection<Group, PieNodeDatum> = Selection.select(this.contentGroup, Group);
    private highlightSelection: Selection<Group, PieNodeDatum> = Selection.select(this.highlightGroup, Group);
    private calloutLabelSelection: Selection<Group, PieNodeDatum>;
    private sectorLabelSelection: Selection<Text, PieNodeDatum>;
    private innerLabelsSelection: Selection<Text, DoughnutInnerLabel>;

    private animationStates: PieStateMachine;

    // The group node that contains the background graphics.
    readonly backgroundGroup: Group;

    /**
     * The processed data that gets visualized.
     */
    private groupSelectionData: PieNodeDatum[] = [];
    private sectorFormatData: AgPieSeriesFormat[] = [];

    private angleScale: LinearScale;

    // When a user toggles a series item (e.g. from the legend), its boolean state is recorded here.
    public seriesItemEnabled: boolean[] = [];

    title?: PieTitle = undefined;
    private oldTitle?: PieTitle;

    calloutLabel = new PieSeriesCalloutLabel();

    readonly sectorLabel = new PieSeriesSectorLabel();

    calloutLine = new PieSeriesCalloutLine();

    tooltip: PieSeriesTooltip = new PieSeriesTooltip();

    set data(input: any[] | undefined) {
        this._data = input;
        this.processSeriesItemEnabled();
    }
    get data() {
        return this._data;
    }

    /**
     * The key of the numeric field to use to determine the angle (for example,
     * a pie sector angle).
     */
    @Validate(STRING)
    angleKey = '';

    @Validate(STRING)
    angleName = '';

    readonly innerLabels: DoughnutInnerLabel[] = [];

    innerCircle?: DoughnutInnerCircle = undefined;
    private oldInnerCircle?: DoughnutInnerCircle;
    private innerCircleNode?: Circle;

    /**
     * The key of the numeric field to use to determine the radii of pie sectors.
     * The largest value will correspond to the full radius and smaller values to
     * proportionally smaller radii.
     */
    @Validate(OPT_STRING)
    radiusKey?: string = undefined;

    @Validate(OPT_STRING)
    radiusName?: string = undefined;

    @Validate(OPT_NUMBER(0))
    radiusMin?: number = undefined;

    @Validate(OPT_NUMBER(0))
    radiusMax?: number = undefined;

    @Validate(OPT_STRING)
    calloutLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    calloutLabelName?: string = undefined;

    @Validate(OPT_STRING)
    sectorLabelKey?: string = undefined;

    @Validate(OPT_STRING)
    sectorLabelName?: string = undefined;

    @Validate(OPT_STRING)
    legendItemKey?: string = undefined;

    @Validate(COLOR_STRING_ARRAY)
    fills: string[] = ['#c16068', '#a2bf8a', '#ebcc87', '#80a0c3', '#b58dae', '#85c0d1'];

    @Validate(COLOR_STRING_ARRAY)
    strokes: string[] = ['#874349', '#718661', '#a48f5f', '#5a7088', '#7f637a', '#5d8692'];

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgPieSeriesFormatterParams<any>) => AgPieSeriesFormat = undefined;

    /**
     * The series rotation in degrees.
     */
    @Validate(NUMBER(-360, 360))
    rotation = 0;

    @Validate(NUMBER())
    outerRadiusOffset = 0;

    @Validate(NUMBER(0))
    outerRadiusRatio = 1;

    @Validate(NUMBER())
    innerRadiusOffset = 0;

    @Validate(NUMBER(0))
    innerRadiusRatio = 1;

    @Validate(NUMBER(0))
    strokeWidth = 1;

    shadow?: DropShadow = undefined;

    readonly highlightStyle = new HighlightStyle();

    constructor() {
        super({ useLabelLayer: true });

        this.angleScale = new LinearScale();
        // Each sector is a ratio of the whole, where all ratios add up to 1.
        this.angleScale.domain = [0, 1];
        // Add 90 deg to start the first pie at 12 o'clock.
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

        this.backgroundGroup = this.rootGroup.appendChild(
            new Group({
                name: `${this.id}-background`,
                layer: true,
                zIndex: Layers.SERIES_BACKGROUND_ZINDEX,
            })
        );

        const pieCalloutLabels = new Group({ name: 'pieCalloutLabels' });
        const pieSectorLabels = new Group({ name: 'pieSectorLabels' });
        const innerLabels = new Group({ name: 'innerLabels' });
        this.labelGroup!.append(pieCalloutLabels);
        this.labelGroup!.append(pieSectorLabels);
        this.labelGroup!.append(innerLabels);
        this.calloutLabelSelection = Selection.select(pieCalloutLabels, Group);
        this.sectorLabelSelection = Selection.select(pieSectorLabels, Text);
        this.innerLabelsSelection = Selection.select(innerLabels, Text);

        this.animationStates = new PieStateMachine('empty', {
            empty: {
                on: {
                    load: {
                        target: 'ready',
                        action: () => this.animateEmptyLoadReady(),
                    },
                },
            },
            ready: {
                on: {},
            },
        });
    }

    addChartEventListeners(): void {
        this.chartEventManager?.addListener('legend-item-click', (event) => this.onLegendItemClick(event));
        this.chartEventManager?.addListener('legend-item-double-click', (event) => this.onLegendItemDoubleClick(event));
    }

    visibleChanged() {
        this.processSeriesItemEnabled();
    }

    private processSeriesItemEnabled() {
        const { data, visible } = this;
        this.seriesItemEnabled = data?.map(() => visible) || [];
    }

    getDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.X) {
            return this.angleScale.domain;
        } else {
            return this.radiusScale.domain;
        }
    }

    async processData() {
        const {
            angleKey,
            radiusKey,
            seriesItemEnabled,
            angleScale,
            groupSelectionData,
            sectorFormatData,
            calloutLabel,
            sectorLabel,
            id: seriesId,
        } = this;
        const data = angleKey && this.data ? this.data : [];

        const angleData: number[] = data.map(
            (datum, index) => (seriesItemEnabled[index] && Math.abs(+datum[angleKey])) || 0
        );
        const angleDataTotal = angleData.reduce((a, b) => a + b, 0);

        // The ratios (in [0, 1] interval) used to calculate the end angle value for every pie sector.
        // Each sector starts where the previous one ends, so we only keep the ratios for end angles.
        const angleDataRatios = (() => {
            let sum = 0;
            return angleData.map((datum) => (sum += datum / angleDataTotal));
        })();

        const labelFormatter = calloutLabel.formatter;
        const labelKey = calloutLabel.enabled ? this.calloutLabelKey : undefined;
        const sectorLabelKey = sectorLabel.enabled ? this.sectorLabelKey : undefined;
        let labelData: string[] = [];
        let sectorLabelData: string[] = [];
        let radiusData: number[] = [];

        const getLabelFormatterParams = (datum: any): AgPieSeriesLabelFormatterParams<any> => {
            return {
                datum,
                angleKey,
                angleValue: datum[angleKey],
                angleName: this.angleName,
                radiusKey,
                radiusValue: radiusKey ? datum[radiusKey] : undefined,
                radiusName: this.radiusName,
                calloutLabelKey: labelKey,
                calloutLabelValue: labelKey ? datum[labelKey] : undefined,
                calloutLabelName: this.calloutLabelName,
                sectorLabelKey,
                sectorLabelValue: sectorLabelKey ? datum[sectorLabelKey] : undefined,
                sectorLabelName: this.sectorLabelName,
                seriesId,
            };
        };

        if (labelKey) {
            if (labelFormatter) {
                labelData = data.map((datum) => labelFormatter(getLabelFormatterParams(datum)));
            } else {
                labelData = data.map((datum) => String(datum[labelKey]));
            }
        }

        const sectorLabelFormatter = sectorLabel.formatter;

        if (sectorLabelKey) {
            if (sectorLabelFormatter) {
                sectorLabelData = data.map((datum) => {
                    const formatterParams = getLabelFormatterParams(datum);
                    return sectorLabelFormatter(formatterParams);
                });
            } else {
                sectorLabelData = data.map((datum) => String(datum[sectorLabelKey]));
            }
        }

        if (radiusKey) {
            const { radiusMin, radiusMax } = this;
            const radii = data.map((datum) => Math.abs(datum[radiusKey]));
            const min = radiusMin ?? 0;
            const max = radiusMax ? radiusMax : Math.max(...radii);
            const delta = max - min;

            radiusData = radii.map((value) => (delta ? (value - min) / delta : 1));
        }

        groupSelectionData.length = 0;
        sectorFormatData.length = 0;
        sectorFormatData.push(...data.map((datum, datumIdx) => this.getSectorFormat(datum, datumIdx, datumIdx, false)));

        const rotation = toRadians(this.rotation);
        const halfPi = Math.PI / 2;

        let datumIndex = 0;

        const quadrantTextOpts: { textAlign: CanvasTextAlign; textBaseline: CanvasTextBaseline }[] = [
            { textAlign: 'center', textBaseline: 'bottom' },
            { textAlign: 'left', textBaseline: 'middle' },
            { textAlign: 'center', textBaseline: 'hanging' },
            { textAlign: 'right', textBaseline: 'middle' },
        ];

        // Process sectors.
        let end = 0;
        angleDataRatios.forEach((start) => {
            if (isNaN(start)) {
                return;
            } // No sectors displayed - nothing to do.

            const radius = radiusKey ? radiusData[datumIndex] : 1;
            const startAngle = angleScale.convert(start) + rotation;
            const endAngle = angleScale.convert(end) + rotation;

            const midAngle = (startAngle + endAngle) / 2;
            const span = Math.abs(endAngle - startAngle);
            const midCos = Math.cos(midAngle);
            const midSin = Math.sin(midAngle);

            const labelMinAngle = toRadians(calloutLabel.minAngle);
            const labelVisible = labelKey && span > labelMinAngle;
            const midAngle180 = normalizeAngle180(midAngle);

            // Split the circle into quadrants like so: ⊗
            const quadrantStart = (-3 * Math.PI) / 4; // same as `normalizeAngle180(toRadians(-135))`
            const quadrantOffset = midAngle180 - quadrantStart;
            const quadrant = Math.floor(quadrantOffset / halfPi);
            const quadrantIndex = mod(quadrant, quadrantTextOpts.length);

            const { textAlign, textBaseline } = quadrantTextOpts[quadrantIndex];
            const datum = data[datumIndex];
            const itemId = datumIndex;

            groupSelectionData.push({
                series: this,
                datum,
                itemId,
                index: datumIndex,
                radius,
                startAngle,
                endAngle,
                midAngle,
                midCos,
                midSin,
                calloutLabel: labelVisible
                    ? {
                          text: labelData[datumIndex],
                          textAlign,
                          textBaseline,
                          hidden: false,
                          collisionTextAlign: undefined,
                          collisionOffsetY: 0,
                          box: undefined,
                      }
                    : undefined,
                sectorLabel: sectorLabelKey
                    ? {
                          text: sectorLabelData[datumIndex],
                      }
                    : undefined,
                sectorFormat: sectorFormatData[datumIndex],
            });

            datumIndex++;
            end = start; // Update for next iteration.
        });
    }

    private getSectorFormat(datum: any, itemId: any, index: number, highlight: any): AgPieSeriesFormat {
        const { angleKey, radiusKey, fills, strokes, fillOpacity: seriesFillOpacity, formatter, id: seriesId } = this;

        const highlightedDatum = this.highlightManager?.getActiveHighlight();
        const isDatumHighlighted = highlight && highlightedDatum?.series === this && itemId === highlightedDatum.itemId;
        const highlightedStyle = isDatumHighlighted ? this.highlightStyle.item : null;

        const fill = highlightedStyle?.fill || fills[index % fills.length];
        const fillOpacity = highlightedStyle?.fillOpacity ?? seriesFillOpacity;
        const stroke = highlightedStyle?.stroke || strokes[index % strokes.length];
        const strokeWidth = highlightedStyle?.strokeWidth ?? this.getStrokeWidth(this.strokeWidth);

        let format: AgPieSeriesFormat | undefined;
        if (formatter) {
            format = formatter({
                datum,
                angleKey,
                radiusKey,
                fill,
                stroke,
                strokeWidth,
                highlighted: isDatumHighlighted,
                seriesId,
            });
        }

        return {
            fill: format?.fill || fill,
            fillOpacity: format?.fillOpacity ?? fillOpacity,
            stroke: format?.stroke || stroke,
            strokeWidth: format?.strokeWidth ?? strokeWidth,
        };
    }

    async createNodeData() {
        return [];
    }

    private getInnerRadius() {
        const { radius, innerRadiusRatio, innerRadiusOffset } = this;
        const innerRadius = radius * (innerRadiusRatio ?? 1) + (innerRadiusOffset ? innerRadiusOffset : 0);
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    private getOuterRadius() {
        const { radius, outerRadiusRatio, outerRadiusOffset } = this;
        const outerRadius = radius * (outerRadiusRatio ?? 1) + (outerRadiusOffset ? outerRadiusOffset : 0);
        if (outerRadius < 0) {
            return 0;
        }
        return outerRadius;
    }

    updateRadiusScale() {
        const innerRadius = this.getInnerRadius();
        const outerRadius = this.getOuterRadius();
        this.radiusScale.range = [innerRadius, outerRadius];
    }

    private getTitleTranslationY() {
        const outerRadius = Math.max(0, this.radiusScale.range[1]);
        if (outerRadius === 0) {
            return NaN;
        }
        const spacing = this.title?.spacing ?? 0;
        const titleOffset = 2 + spacing;
        const minLabelY = Math.min(0, ...this.groupSelectionData.map((d) => d.calloutLabel?.box?.y || 0));
        const dy = Math.max(0, -outerRadius - minLabelY);
        return -outerRadius - titleOffset - dy;
    }

    async update() {
        const { title } = this;

        this.updateTitleNodes();
        this.updateRadiusScale();
        this.updateInnerCircleNodes();

        this.rootGroup.translationX = this.centerX;
        this.rootGroup.translationY = this.centerY;

        if (title) {
            const dy = this.getTitleTranslationY();
            if (isFinite(dy)) {
                title.node.visible = title.enabled;
                title.node.translationY = dy;
            } else {
                title.node.visible = false;
            }
        }

        this.updateNodeMidPoint();

        await this.updateSelections();
        await this.updateNodes();
    }

    private updateTitleNodes() {
        const { title, oldTitle } = this;

        if (oldTitle !== title) {
            if (oldTitle) {
                this.labelGroup?.removeChild(oldTitle.node);
            }

            if (title) {
                title.node.textBaseline = 'bottom';
                this.labelGroup?.appendChild(title.node);
            }

            this.oldTitle = title;
        }
    }

    private updateInnerCircleNodes() {
        const { innerCircle, oldInnerCircle, innerCircleNode: oldNode } = this;
        if (oldInnerCircle !== innerCircle) {
            let circle: Circle | undefined;
            if (oldNode) {
                this.backgroundGroup.removeChild(oldNode);
            }

            if (innerCircle) {
                circle = new Circle();
                circle.fill = innerCircle.fill;
                circle.fillOpacity = innerCircle.fillOpacity ?? 1;
                this.backgroundGroup.appendChild(circle);
            }

            this.oldInnerCircle = innerCircle;
            this.innerCircleNode = circle;
        }
    }

    private updateNodeMidPoint() {
        this.groupSelectionData.forEach((d) => {
            const radius = this.radiusScale.convert(d.radius);
            d.nodeMidPoint = {
                x: d.midCos * Math.max(0, radius / 2),
                y: d.midSin * Math.max(0, radius / 2),
            };
        });
    }

    private async updateSelections() {
        await this.updateGroupSelection();
    }

    private async updateGroupSelection() {
        const {
            groupSelection,
            highlightSelection,
            calloutLabelSelection,
            sectorLabelSelection,
            innerLabelsSelection,
        } = this;

        const update = (selection: typeof groupSelection) => {
            return selection.update(this.groupSelectionData, (group) => {
                const sector = new Sector();
                sector.tag = PieNodeTag.Sector;
                group.appendChild(sector);
            });
        };

        this.groupSelection = update(groupSelection);
        this.highlightSelection = update(highlightSelection);

        calloutLabelSelection.update(this.groupSelectionData, (group) => {
            const line = new Line();
            line.tag = PieNodeTag.Callout;
            line.pointerEvents = PointerEvents.None;
            group.appendChild(line);

            const text = new Text();
            text.tag = PieNodeTag.Label;
            text.pointerEvents = PointerEvents.None;
            group.appendChild(text);
        });

        sectorLabelSelection.update(this.groupSelectionData, (node) => {
            node.pointerEvents = PointerEvents.None;
        });

        innerLabelsSelection.update(this.innerLabels, (node) => {
            node.pointerEvents = PointerEvents.None;
        });
    }

    private datumSectorRefs = new WeakMap<PieNodeDatum, Sector>();

    private async updateNodes() {
        const seriesBox = this.chart?.getSeriesRect();
        if (seriesBox == null) {
            return;
        }

        const highlightedDatum = this.highlightManager?.getActiveHighlight();
        const isVisible = this.seriesItemEnabled.indexOf(true) >= 0;
        this.rootGroup.visible = isVisible;
        this.backgroundGroup.visible = isVisible;
        this.contentGroup.visible = isVisible;
        this.highlightGroup.visible = isVisible && highlightedDatum?.series === this;
        this.labelGroup!.visible = isVisible;

        this.contentGroup.opacity = this.getOpacity();

        this.updateInnerCircle();

        const { radiusScale } = this;

        const innerRadius = radiusScale.convert(0);

        const updateSectorFn = (sector: Sector, datum: PieNodeDatum, index: number, isDatumHighlighted: boolean) => {
            const radius = radiusScale.convert(datum.radius);
            // Bring highlighted sector's parent group to front.
            const sectorParent = sector.parent;
            const sectorGrandParent = sectorParent?.parent;
            if (isDatumHighlighted && sectorParent && sectorGrandParent) {
                sectorGrandParent.removeChild(sectorParent);
                sectorGrandParent.appendChild(sectorParent);
            }

            sector.innerRadius = Math.max(0, innerRadius);
            sector.outerRadius = Math.max(0, radius);

            if (isDatumHighlighted) {
                sector.startAngle = datum.startAngle;
                sector.endAngle = datum.endAngle;
            }

            const format = this.getSectorFormat(datum.datum, datum.itemId, index, isDatumHighlighted);

            sector.fill = format.fill;
            sector.stroke = format.stroke;
            sector.strokeWidth = format.strokeWidth!;
            sector.fillOpacity = format.fillOpacity!;
            sector.strokeOpacity = this.strokeOpacity;
            sector.lineDash = this.lineDash;
            sector.lineDashOffset = this.lineDashOffset;
            sector.fillShadow = this.shadow;
            sector.lineJoin = 'round';
            sector.visible = this.seriesItemEnabled[index];

            this.datumSectorRefs.set(datum, sector);
        };

        this.groupSelection
            .selectByTag<Sector>(PieNodeTag.Sector)
            .forEach((node, index) => updateSectorFn(node, node.datum, index, false));
        this.highlightSelection.selectByTag<Sector>(PieNodeTag.Sector).forEach((node, index) => {
            const isDatumHighlighted =
                highlightedDatum?.series === this && node.datum.itemId === highlightedDatum.itemId;

            node.visible = isDatumHighlighted;
            if (node.visible) {
                updateSectorFn(node, node.datum, index, isDatumHighlighted);
            }
        });

        this.animationStates.transition('load');

        this.updateCalloutLineNodes();
        this.updateCalloutLabelNodes(seriesBox);
        this.updateSectorLabelNodes();
        this.updateInnerLabelNodes();
    }

    updateCalloutLineNodes() {
        const { radiusScale, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const calloutStrokeWidth = calloutLine.strokeWidth;
        const calloutColors = calloutLine.colors || this.strokes;
        const { offset } = this.calloutLabel;

        this.calloutLabelSelection.selectByTag<Line>(PieNodeTag.Callout).forEach((line, index) => {
            const datum = line.datum as PieNodeDatum;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            const label = datum.calloutLabel;

            if (label && label.text && !label.hidden && outerRadius !== 0) {
                line.visible = true;
                line.strokeWidth = calloutStrokeWidth;
                line.stroke = calloutColors[index % calloutColors.length];
                line.fill = undefined;

                const x1 = datum.midCos * outerRadius;
                const y1 = datum.midSin * outerRadius;
                let x2 = datum.midCos * (outerRadius + calloutLength);
                let y2 = datum.midSin * (outerRadius + calloutLength);

                if (label.collisionTextAlign || label.collisionOffsetY !== 0) {
                    // Get the closest point to the text bounding box
                    const box = label.box!;
                    const cx = x2 < box.x ? box.x : x2 > box.x + box.width ? box.x + box.width : x2;
                    const cy = y2 < box.y ? box.y : y2 > box.y + box.height ? box.y + box.height : y2;

                    // Apply label offset
                    const dx = cx - x2;
                    const dy = cy - y2;
                    const length = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                    const paddedLength = length - offset;
                    if (paddedLength > 0) {
                        x2 = x2 + (dx * paddedLength) / length;
                        y2 = y2 + (dy * paddedLength) / length;
                    }
                }

                line.x1 = x1;
                line.y1 = y1;
                line.x2 = x2;
                line.y2 = y2;
            } else {
                line.visible = false;
            }
        });
    }

    private getLabelOverflow(text: string, box: BBox, seriesRect: BBox) {
        const seriesLeft = seriesRect.x - this.centerX;
        const seriesRight = seriesRect.x + seriesRect.width - this.centerX;
        const seriesTop = seriesRect.y - this.centerY;
        const seriesBottom = seriesRect.y + seriesRect.height - this.centerY;
        const errPx = 1; // Prevents errors related to floating point calculations
        let visibleTextPart = 1;
        if (box.x + errPx < seriesLeft) {
            visibleTextPart = (box.x + box.width - seriesLeft) / box.width;
        } else if (box.x + box.width - errPx > seriesRight) {
            visibleTextPart = (seriesRight - box.x) / box.width;
        }

        const hasVerticalOverflow = box.y + errPx < seriesTop || box.y + box.height - errPx > seriesBottom;
        const textLength = Math.floor(text.length * visibleTextPart) - 1;
        return { visibleTextPart, textLength, hasVerticalOverflow };
    }

    private computeCalloutLabelCollisionOffsets() {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const { offset, minSpacing } = calloutLabel;
        const innerRadius = radiusScale.convert(0);

        const shouldSkip = (datum: PieNodeDatum) => {
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);
            return !label || outerRadius === 0;
        };

        const fullData = this.groupSelectionData;
        const data = this.groupSelectionData.filter((text) => !shouldSkip(text));
        data.forEach((datum) => {
            const label = datum.calloutLabel!;
            label.hidden = false;
            label.collisionTextAlign = undefined;
            label.collisionOffsetY = 0;
        });

        if (data.length <= 1) {
            return;
        }

        const leftLabels = data.filter((d) => d.midCos < 0).sort((a, b) => a.midSin - b.midSin);
        const rightLabels = data.filter((d) => d.midCos >= 0).sort((a, b) => a.midSin - b.midSin);
        const topLabels = data
            .filter((d) => d.midSin < 0 && d.calloutLabel!.textAlign === 'center')
            .sort((a, b) => a.midCos - b.midCos);
        const bottomLabels = data
            .filter((d) => d.midSin >= 0 && d.calloutLabel!.textAlign === 'center')
            .sort((a, b) => a.midCos - b.midCos);

        const tempTextNode = new Text();
        const getTextBBox = (datum: PieNodeDatum) => {
            const label = datum.calloutLabel!;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            const labelRadius = outerRadius + calloutLine.length + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;

            this.setTextDimensionalProps(tempTextNode, x, y, this.calloutLabel, label);
            return tempTextNode.computeBBox();
        };

        const avoidNeighbourYCollision = (
            label: PieNodeDatum,
            next: PieNodeDatum,
            direction: 'to-top' | 'to-bottom'
        ) => {
            const box = getTextBBox(label).grow(minSpacing / 2);
            const other = getTextBBox(next).grow(minSpacing / 2);
            // The full collision is not detected, because sometimes
            // the next label can appear behind the label with offset
            const collidesOrBehind =
                box.x < other.x + other.width &&
                box.x + box.width > other.x &&
                (direction === 'to-top' ? box.y < other.y + other.height : box.y + box.height > other.y);
            if (collidesOrBehind) {
                const dy = direction === 'to-top' ? box.y - other.y - other.height : box.y + box.height - other.y;
                next.calloutLabel!.collisionOffsetY = dy;
            }
        };

        const avoidYCollisions = (labels: PieNodeDatum[]) => {
            const midLabel = labels.slice().sort((a, b) => Math.abs(a.midSin) - Math.abs(b.midSin))[0];
            const midIndex = labels.indexOf(midLabel);
            for (let i = midIndex - 1; i >= 0; i--) {
                const prev = labels[i + 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-top');
            }
            for (let i = midIndex + 1; i < labels.length; i++) {
                const prev = labels[i - 1];
                const next = labels[i];
                avoidNeighbourYCollision(prev, next, 'to-bottom');
            }
        };

        const avoidXCollisions = (labels: PieNodeDatum[]) => {
            const labelsCollideLabelsByY = data.some((datum) => datum.calloutLabel!.collisionOffsetY !== 0);

            const boxes = labels.map((label) => getTextBBox(label));
            const paddedBoxes = boxes.map((box) => box.clone().grow(minSpacing / 2));

            let labelsCollideLabelsByX = false;
            loop: for (let i = 0; i < paddedBoxes.length; i++) {
                const box = paddedBoxes[i];
                for (let j = i + 1; j < labels.length; j++) {
                    const other = paddedBoxes[j];
                    if (box.collidesBBox(other)) {
                        labelsCollideLabelsByX = true;
                        break loop;
                    }
                }
            }

            const sectors = fullData.map((datum) => {
                const { startAngle, endAngle } = datum;
                const radius = radiusScale.convert(datum.radius);
                const outerRadius = Math.max(0, radius);
                return { startAngle, endAngle, innerRadius, outerRadius };
            });
            const labelsCollideSectors = boxes.some((box) => {
                return sectors.some((sector) => boxCollidesSector(box, sector));
            });

            if (!labelsCollideLabelsByX && !labelsCollideLabelsByY && !labelsCollideSectors) {
                return;
            }

            labels
                .filter((datum) => datum.calloutLabel!.textAlign === 'center')
                .forEach((datum) => {
                    const label = datum.calloutLabel!;
                    label.collisionTextAlign = datum.midCos < 0 ? 'right' : datum.midCos > 0 ? 'left' : 'center';
                });
        };

        avoidYCollisions(leftLabels);
        avoidYCollisions(rightLabels);
        avoidXCollisions(topLabels);
        avoidXCollisions(bottomLabels);
    }

    private updateCalloutLabelNodes(seriesRect: BBox) {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const { offset, color } = calloutLabel;

        const tempTextNode = new Text();

        this.calloutLabelSelection.selectByTag<Text>(PieNodeTag.Label).forEach((text) => {
            const { datum } = text;
            const label = datum.calloutLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            if (!label || !label.text || outerRadius === 0 || label.hidden) {
                text.visible = false;
                return;
            }

            const labelRadius = outerRadius + calloutLength + offset;
            const x = datum.midCos * labelRadius;
            const y = datum.midSin * labelRadius + label.collisionOffsetY;

            // Detect text overflow
            this.setTextDimensionalProps(tempTextNode, x, y, this.calloutLabel, label);
            const box = tempTextNode.computeBBox();
            const { visibleTextPart, textLength, hasVerticalOverflow } = this.getLabelOverflow(
                label.text,
                box,
                seriesRect
            );
            const displayText = visibleTextPart === 1 ? label.text : `${label.text.substring(0, textLength)}…`;

            this.setTextDimensionalProps(text, x, y, this.calloutLabel, { ...label, text: displayText });
            text.fill = color;
            text.visible = !hasVerticalOverflow;
        });
    }

    computeLabelsBBox(options: { hideWhenNecessary: boolean }, seriesRect: BBox): BBox | null {
        const { radiusScale, calloutLabel, calloutLine } = this;
        const calloutLength = calloutLine.length;
        const { offset, maxCollisionOffset } = calloutLabel;
        this.updateRadiusScale();
        this.computeCalloutLabelCollisionOffsets();

        const text = new Text();
        const textBoxes = this.groupSelectionData
            .map((datum) => {
                const label = datum.calloutLabel;
                const radius = radiusScale.convert(datum.radius);
                const outerRadius = Math.max(0, radius);
                if (!label || outerRadius === 0) {
                    return null;
                }

                const labelRadius = outerRadius + calloutLength + offset;
                const x = datum.midCos * labelRadius;
                const y = datum.midSin * labelRadius + label.collisionOffsetY;
                this.setTextDimensionalProps(text, x, y, this.calloutLabel, label);
                const box = text.computeBBox();
                label.box = box;

                if (Math.abs(label.collisionOffsetY) > maxCollisionOffset) {
                    label.hidden = true;
                    return null;
                }

                if (options.hideWhenNecessary) {
                    const { textLength, hasVerticalOverflow } = this.getLabelOverflow(label.text, box, seriesRect);
                    const isTooShort = label.text.length > 2 && textLength < 2;

                    if (hasVerticalOverflow || isTooShort) {
                        label.hidden = true;
                        return null;
                    }
                }

                label.hidden = false;
                return box;
            })
            .filter((box) => box != null) as BBox[];
        if (this.title && this.title.text) {
            const dy = this.getTitleTranslationY();
            if (isFinite(dy)) {
                this.setTextDimensionalProps(text, 0, dy, this.title, {
                    text: this.title.text,
                    textBaseline: 'bottom',
                    textAlign: 'center',
                    hidden: false,
                    collisionTextAlign: undefined,
                    collisionOffsetY: 0,
                });
                const box = text.computeBBox();
                textBoxes.push(box);
            }
        }
        if (textBoxes.length === 0) {
            return null;
        }
        return BBox.merge(textBoxes);
    }

    private setTextDimensionalProps(
        textNode: Text,
        x: number,
        y: number,
        style: Caption | Label,
        label: PieNodeDatum['calloutLabel']
    ) {
        const { fontStyle, fontWeight, fontSize, fontFamily } = style;
        textNode.fontStyle = fontStyle;
        textNode.fontWeight = fontWeight;
        textNode.fontSize = fontSize!;
        textNode.fontFamily = fontFamily!;
        textNode.text = label!.text;
        textNode.x = x;
        textNode.y = y;
        textNode.textAlign = label!.collisionTextAlign || label!.textAlign;
        textNode.textBaseline = label!.textBaseline;
    }

    private updateSectorLabelNodes() {
        const { radiusScale } = this;
        const innerRadius = radiusScale.convert(0);
        const { fontSize, fontStyle, fontWeight, fontFamily, positionOffset, positionRatio, color } = this.sectorLabel;

        const isDoughnut = innerRadius > 0;
        const singleVisibleSector = this.seriesItemEnabled.filter(Boolean).length === 1;

        this.sectorLabelSelection.each((text, datum) => {
            const sectorLabel = datum.sectorLabel;
            const radius = radiusScale.convert(datum.radius);
            const outerRadius = Math.max(0, radius);

            let isTextVisible = false;
            if (sectorLabel && outerRadius !== 0) {
                const labelRadius = innerRadius * (1 - positionRatio) + radius * positionRatio + positionOffset;

                text.fill = color;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.text = sectorLabel.text;
                const shouldPutTextInCenter = !isDoughnut && singleVisibleSector;
                if (shouldPutTextInCenter) {
                    text.x = 0;
                    text.y = 0;
                } else {
                    text.x = datum.midCos * labelRadius;
                    text.y = datum.midSin * labelRadius;
                }
                text.textAlign = 'center';
                text.textBaseline = 'middle';

                const sector = this.datumSectorRefs.get(datum);
                if (sector) {
                    const bbox = text.computeBBox();
                    const corners = [
                        [bbox.x, bbox.y],
                        [bbox.x + bbox.width, bbox.y],
                        [bbox.x + bbox.width, bbox.y + bbox.height],
                        [bbox.x, bbox.y + bbox.height],
                    ];
                    const { startAngle, endAngle } = datum;
                    const sectorBounds = { startAngle, endAngle, innerRadius, outerRadius };
                    if (corners.every(([x, y]) => isPointInSector(x, y, sectorBounds))) {
                        isTextVisible = true;
                    }
                }
            }
            text.visible = isTextVisible;
        });
    }

    private updateInnerCircle() {
        const circle = this.innerCircleNode;
        if (!circle) {
            return;
        }
        const innerRadius = this.getInnerRadius();
        if (innerRadius === 0) {
            circle.size = 0;
        } else {
            const circleRadius = Math.min(innerRadius, this.getOuterRadius());
            const antiAliasingPadding = 1;
            circle.size = Math.ceil(circleRadius * 2 + antiAliasingPadding);
        }
    }

    private updateInnerLabelNodes() {
        const textBBoxes: BBox[] = [];
        const margins: number[] = [];
        this.innerLabelsSelection.each((text, datum) => {
            const { fontStyle, fontWeight, fontSize, fontFamily, color } = datum;
            text.fontStyle = fontStyle;
            text.fontWeight = fontWeight;
            text.fontSize = fontSize;
            text.fontFamily = fontFamily;
            text.text = datum.text;
            text.x = 0;
            text.y = 0;
            text.fill = color;
            text.textAlign = 'center';
            text.textBaseline = 'alphabetic';
            textBBoxes.push(text.computeBBox());
            margins.push(datum.margin);
        });
        const getMarginTop = (index: number) => (index === 0 ? 0 : margins[index]);
        const getMarginBottom = (index: number) => (index === margins.length - 1 ? 0 : margins[index]);
        const totalHeight = textBBoxes.reduce((sum, bbox, i) => {
            return sum + bbox.height + getMarginTop(i) + getMarginBottom(i);
        }, 0);
        const totalWidth = Math.max(...textBBoxes.map((bbox) => bbox.width));
        const innerRadius = this.getInnerRadius();
        const labelRadius = Math.sqrt(Math.pow(totalWidth / 2, 2) + Math.pow(totalHeight / 2, 2));
        const labelsVisible = labelRadius <= (innerRadius > 0 ? innerRadius : this.getOuterRadius());

        const textBottoms: number[] = [];
        for (let i = 0, prev = -totalHeight / 2; i < textBBoxes.length; i++) {
            const bbox = textBBoxes[i];
            const bottom = bbox.height + prev + getMarginTop(i);
            textBottoms.push(bottom);
            prev = bottom + getMarginBottom(i);
        }
        this.innerLabelsSelection.each((text, _datum, index) => {
            text.y = textBottoms[index];
            text.visible = labelsVisible;
        });
    }

    protected getNodeClickEvent(event: MouseEvent, datum: PieNodeDatum): PieSeriesNodeClickEvent {
        return new PieSeriesNodeClickEvent(
            this.angleKey,
            this.calloutLabelKey,
            this.sectorLabelKey,
            this.radiusKey,
            event,
            datum,
            this
        );
    }

    protected getNodeDoubleClickEvent(event: MouseEvent, datum: PieNodeDatum): PieSeriesNodeDoubleClickEvent {
        return new PieSeriesNodeDoubleClickEvent(
            this.angleKey,
            this.calloutLabelKey,
            this.sectorLabelKey,
            this.radiusKey,
            event,
            datum,
            this
        );
    }

    getTooltipHtml(nodeDatum: PieNodeDatum): string {
        const { angleKey } = this;

        if (!angleKey) {
            return '';
        }

        const {
            tooltip,
            angleName,
            radiusKey,
            radiusName,
            calloutLabelKey,
            sectorLabelKey,
            calloutLabelName,
            sectorLabelName,
            id: seriesId,
        } = this;

        const { renderer: tooltipRenderer } = tooltip;
        const color = nodeDatum.sectorFormat.fill;
        const datum = nodeDatum.datum;
        const label = calloutLabelKey ? `${datum[calloutLabelKey]}: ` : '';
        const angleValue = datum[angleKey];
        const formattedAngleValue = typeof angleValue === 'number' ? toFixed(angleValue) : angleValue.toString();
        const title = this.title ? this.title.text : undefined;
        const content = label + formattedAngleValue;
        const defaults: AgTooltipRendererResult = {
            title,
            backgroundColor: color,
            content,
        };

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
                    datum,
                    angleKey,
                    angleValue,
                    angleName,
                    radiusKey,
                    radiusValue: radiusKey ? datum[radiusKey] : undefined,
                    radiusName,
                    calloutLabelKey,
                    calloutLabelName,
                    sectorLabelKey,
                    sectorLabelName,
                    title,
                    color,
                    seriesId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): ChartLegendDatum[] {
        const { calloutLabelKey, legendItemKey, data, id, sectorFormatData } = this;

        if (!data || data.length === 0 || (!legendItemKey && !calloutLabelKey)) return [];

        const titleText = this.title && this.title.showInLegend && this.title.text;
        const legendData: CategoryLegendDatum[] = data.map((datum, index) => {
            const labelParts = [];
            titleText && labelParts.push(titleText);
            if (legendItemKey) {
                labelParts.push(String(datum[legendItemKey]));
            } else if (calloutLabelKey) {
                labelParts.push(String(datum[calloutLabelKey]));
            }

            return {
                legendType: 'category',
                id,
                itemId: index,
                seriesId: id,
                enabled: this.seriesItemEnabled[index],
                label: {
                    text: labelParts.join(' - '),
                },
                marker: {
                    fill: sectorFormatData[index].fill!,
                    stroke: sectorFormatData[index].stroke!,
                    fillOpacity: this.fillOpacity,
                    strokeOpacity: this.strokeOpacity,
                },
            };
        });

        return legendData;
    }

    onLegendItemClick(event: LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id === this.id) {
            this.toggleSeriesItem(itemId, enabled);
        } else if (series.type === 'pie') {
            this.toggleOtherSeriesItems(series as PieSeries, itemId, enabled);
        }
    }

    onLegendItemDoubleClick(event: LegendItemDoubleClickChartEvent) {
        const { enabled, itemId, series: maybeSeries, numVisibleItems } = event;

        if (maybeSeries.type !== 'pie') return;

        const series = maybeSeries as PieSeries;

        const clickedLegendValue =
            series.legendItemKey && series.data?.find((_, index) => index === itemId)[series.legendItemKey];
        const totalVisibleItems = Object.values(numVisibleItems).reduce((p, v) => p + v, 0);
        const singleEnabledInEachSeries = Object.values(numVisibleItems).filter((v) => v > 1).length === 0;
        const singleEnabledWasClicked = totalVisibleItems === 1 && enabled;

        this.data?.forEach((datum, index) => {
            const wasClicked = series.id === this.id && itemId === index;
            const matchesClickedLegendValue =
                series.id !== this.id && this.legendItemKey != null && datum[this.legendItemKey] === clickedLegendValue;

            const newEnabled =
                wasClicked ||
                singleEnabledWasClicked ||
                matchesClickedLegendValue ||
                (singleEnabledInEachSeries && enabled);

            this.toggleSeriesItem(index, newEnabled);
        });
    }

    toggleSeriesItem(itemId: number, enabled: boolean): void {
        this.seriesItemEnabled[itemId] = enabled;
        this.nodeDataRefresh = true;
    }

    toggleOtherSeriesItems(series: PieSeries, itemId: number, enabled: boolean): void {
        const { legendItemKey } = this;

        if (!legendItemKey) return;

        const datumToggledLegendItemValue =
            series.legendItemKey && series.data?.find((_, index) => index === itemId)[series.legendItemKey];

        if (!datumToggledLegendItemValue) return;

        this.data?.forEach((datum, datumItemId) => {
            if (datum[legendItemKey] === datumToggledLegendItemValue) {
                this.toggleSeriesItem(datumItemId, enabled);
            }
        });
    }

    animateEmptyLoadReady() {
        const rotation = Math.PI / -2 + toRadians(this.rotation);

        this.groupSelection.selectByTag<Sector>(PieNodeTag.Sector).forEach((node) => {
            const { datum } = node;

            if (!this.animationManager) {
                node.startAngle = datum.startAngle;
                node.endAngle = datum.endAngle;
                return;
            }

            node.startAngle = rotation;
            node.endAngle = rotation;

            this.animationManager.animateMany<number>(
                `${this.id}_empty-load-ready_${node.id}`,
                [
                    { from: rotation, to: datum.startAngle },
                    { from: rotation, to: datum.endAngle },
                ],
                {
                    duration: 1000,
                    repeat: 0,
                    ease: easing.linear,
                    onUpdate: ([startAngle, endAngle]) => {
                        node.startAngle = startAngle;
                        node.endAngle = endAngle;
                    },
                }
            );
        });
    }
}
