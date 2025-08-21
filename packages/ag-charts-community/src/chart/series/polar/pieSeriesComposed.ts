import { type InternalAgColorType, type Point } from 'ag-charts-core';
import type { AgDonutSeriesOptions, AgDonutSeriesStyle, AgPieSeriesStyle } from 'ag-charts-types';

import type { ModuleContext } from '../../../module/moduleContext';
import { LinearScale } from '../../../scale/linearScale';
import { BBox } from '../../../scene/bbox';
import { Group, TranslatableGroup } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import { Selection } from '../../../scene/selection';
import { Sector } from '../../../scene/shape/sector';
import { Text } from '../../../scene/shape/text';
import { jsonDiff } from '../../../util/json';
import { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import { DataModel, type ProcessedData } from '../../data/dataModel';
import type { CategoryLegendDatum, ChartLegendType } from '../../legend/legendDatum';
import { Marker } from '../../marker/marker';
import { type TooltipContent } from '../../tooltip/tooltip';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';
import { SeriesNodeEvent, type SeriesNodePickMatch, SeriesNodePickMode } from '../series';
import { resetLabelFn } from '../seriesLabelUtil';
import type { SeriesNodeEventTypes } from '../seriesTypes';
import { PolarDataProcessor } from '../utils/dataUtils';
import type { ProcessedDataValues } from '../utils/interfaces';
import { CategoryLegendProvider } from '../utils/legendUtils';
// Import our extracted utilities
import { PolarTooltipProvider } from '../utils/tooltipUtils';
import type { DonutInnerLabel } from './donutSeriesProperties';
import { DonutSeriesProperties } from './donutSeriesProperties';
import { pickByMatchingAngle, resetPieSelectionsFn } from './pieUtil';
import { DEFAULT_POLAR_DIRECTION_KEYS, DEFAULT_POLAR_DIRECTION_NAMES, PolarSeries } from './polarSeries';
import { PolarZIndexMap } from './polarZIndexMap';

// Re-use the same interfaces from DonutSeries
interface PieDonutLabelDatum {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
    hidden: boolean;
    collisionTextAlign?: CanvasTextAlign;
    collisionOffsetY: number;
    box?: BBox;
}

interface PieDonutNodeDatum extends DataModelSeriesNodeDatum {
    readonly radius: number; // in the [0, 1] range
    readonly innerRadius: number;
    readonly outerRadius: number;
    readonly angleValue: number;
    readonly radiusValue?: number;
    readonly startAngle: number;
    readonly endAngle: number;
    readonly midAngle: number;
    readonly midCos: number;
    readonly midSin: number;

    readonly calloutLabel?: PieDonutLabelDatum;

    readonly sectorLabel?: {
        readonly text: string;
    };

    readonly sectorFormat: { [key in keyof Omit<Required<PieDonutSeriesStyle>, 'fill'>]: PieDonutSeriesStyle[key] } & {
        fill?: InternalAgColorType;
    };
    readonly legendItem?: { key: string; text: string };
    readonly legendItemValue?: string;
    enabled: boolean;
}

interface PieDonutSeriesStyle extends AgDonutSeriesStyle, AgPieSeriesStyle {}

class PieDonutSeriesNodeEvent<TEvent extends string = SeriesNodeEventTypes> extends SeriesNodeEvent<
    PieDonutNodeDatum,
    TEvent
> {
    readonly angleKey: string;
    readonly radiusKey?: string;
    readonly calloutLabelKey?: string;
    readonly sectorLabelKey?: string;
    constructor(type: TEvent, nativeEvent: Event, datum: PieDonutNodeDatum, series: PieSeriesComposed) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
        this.calloutLabelKey = series.properties.calloutLabelKey;
        this.sectorLabelKey = series.properties.sectorLabelKey;
    }
}

/**
 * PieSeriesComposed - A composition-based implementation of pie charts
 *
 * This class demonstrates the composition approach for the series refactoring spike.
 * Instead of inheriting from DonutSeries -> PolarSeries -> DataModelSeries -> Series,
 * it extends directly from PolarSeries and uses composition for major functionality.
 */
export class PieSeriesComposed extends PolarSeries<
    PieDonutNodeDatum,
    AgDonutSeriesOptions,
    DonutSeriesProperties,
    Sector
> {
    static readonly className: string = 'PieSeriesComposed';
    static readonly type: string = 'pie-composed';

    override properties = new DonutSeriesProperties();

    // Composed utilities instead of inheritance
    private readonly tooltipProvider: PolarTooltipProvider;
    private readonly legendProvider: CategoryLegendProvider;
    private readonly dataProcessor: PolarDataProcessor<PieDonutNodeDatum>;

    // Essential properties from DonutSeries

    readonly backgroundGroup = new TranslatableGroup({
        name: `${this.id}-background`,
        zIndex: PolarZIndexMap.BACKGROUND,
    });

    private readonly previousRadiusScale: LinearScale = new LinearScale();
    private readonly radiusScale: LinearScale = new LinearScale();
    protected phantomGroup = this.backgroundGroup.appendChild(new Group({ name: 'phantom' }));

    readonly zerosumRingsGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-zerosumRings` }));
    readonly zerosumOuterRing = this.zerosumRingsGroup.appendChild(new Marker({ shape: 'circle' }));
    readonly zerosumInnerRing = this.zerosumRingsGroup.appendChild(new Marker({ shape: 'circle' }));

    readonly innerLabelsGroup = this.contentGroup.appendChild(new Group({ name: 'innerLabels' }));
    readonly innerCircleGroup = this.backgroundGroup.appendChild(new Group({ name: `${this.id}-innerCircle` }));
    readonly innerLabelsSelection: Selection<Text, DonutInnerLabel> = Selection.select(this.innerLabelsGroup, Text);
    readonly innerCircleSelection: Selection<Marker, { radius: number }> = Selection.select(
        this.innerCircleGroup,
        () => new Marker({ shape: 'circle' })
    );

    private readonly angleScale: LinearScale;
    override surroundingRadius?: number = undefined;

    constructor(moduleCtx: ModuleContext) {
        super({
            moduleCtx,
            categoryKey: undefined,
            propertyKeys: {
                ...DEFAULT_POLAR_DIRECTION_KEYS,
                sectorLabel: ['sectorLabelKey'],
                calloutLabel: ['calloutLabelKey'],
            },
            propertyNames: {
                ...DEFAULT_POLAR_DIRECTION_NAMES,
                sectorLabel: ['sectorLabelName'],
                calloutLabel: ['calloutLabelName'],
            },
            pickModes: [SeriesNodePickMode.NEAREST_NODE, SeriesNodePickMode.EXACT_SHAPE_MATCH],
            animationResetFns: { item: resetPieSelectionsFn, label: resetLabelFn },
        });

        this.angleScale = new LinearScale();
        this.angleScale.domain = [0, 1];
        this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);

        this.phantomGroup.opacity = 0.2;
        this.innerLabelsGroup.pointerEvents = PointerEvents.None;

        // Initialize composed utilities - casting is necessary due to constructor timing
        // The 'this' reference will have all required methods once construction is complete
        this.tooltipProvider = new PolarTooltipProvider(this as any);
        this.legendProvider = new CategoryLegendProvider(this as any);
        this.dataProcessor = new PolarDataProcessor(this as any);
    }

    override attachSeries(seriesContentNode: Group, seriesNode: Group, annotationNode: Group | undefined): void {
        super.attachSeries(seriesContentNode, seriesNode, annotationNode);
        seriesContentNode?.appendChild(this.backgroundGroup);
    }

    override detachSeries(
        seriesContentNode: Group | undefined,
        seriesNode: Group,
        annotationNode: Group | undefined
    ): void {
        super.detachSeries(seriesContentNode, seriesNode, annotationNode);
        seriesContentNode?.removeChild(this.backgroundGroup);
    }

    override setZIndex(zIndex: number) {
        super.setZIndex(zIndex);
        this.backgroundGroup.zIndex = [PolarZIndexMap.BACKGROUND, zIndex];
    }

    protected override nodeFactory(): Sector {
        const sector = new Sector();
        sector.miterLimit = 1e9;
        return sector;
    }

    override getSeriesDomain(direction: ChartAxisDirection): any[] {
        if (direction === ChartAxisDirection.Angle) {
            return this.angleScale.domain;
        } else {
            return this.radiusScale.domain;
        }
    }

    // Delegate data processing to composed utility
    override async processData(dataController: DataController) {
        return this.dataProcessor.processData(dataController);
    }

    // Use composition for tooltip functionality (REDUCED from ~70 lines to ~5 lines)
    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        return this.tooltipProvider.getTooltipContent(datumIndex);
    }

    // Use composition for legend functionality (REDUCED from ~74 lines to ~5 lines)
    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        return this.legendProvider.getLegendData(legendType);
    }

    // Simplified methods that delegate to the original DonutSeries for core functionality
    // This demonstrates how composition can be gradually introduced

    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues {
        return this.dataProcessor.getProcessedDataValues(dataModel, processedData);
    }

    // Required abstract method implementations
    override createNodeData() {
        return this.dataProcessor.createNodeData();
    }

    protected hasItemStylers(): boolean {
        return false; // Simplified for composition approach
    }

    // Required methods for interface compatibility
    getLabelContent(datumIndex: number, _datum: any, values: any): any {
        // Simplified implementation - in full version this would be extracted to utility
        return {
            legendItem: values.legendItemValues?.[datumIndex],
            callout: values.calloutLabelValues?.[datumIndex],
            sector: values.sectorLabelValues?.[datumIndex],
        };
    }

    getItemStyle(datum: { datum: any; datumIndex: number }, _isHighlight: boolean): any {
        // Simplified implementation - in full version this would be extracted to utility
        return {
            fill: this.properties.fills?.[datum.datumIndex % (this.properties.fills?.length ?? 1)],
        };
    }

    legendItemSymbol(datumIndex: number): any {
        // Simplified implementation - in full version this would be extracted to utility
        return {
            shape: 'square',
            fill: this.properties.fills?.[datumIndex % (this.properties.fills?.length ?? 1)],
        };
    }

    // Essential DonutSeries methods that we need to maintain for functionality
    // These could be extracted into additional utility classes in a full implementation

    override getInnerRadius() {
        const { radius } = this;
        const { innerRadiusRatio = 1, innerRadiusOffset = 0 } = this.properties;
        const innerRadius = radius * innerRadiusRatio + innerRadiusOffset;
        if (innerRadius === radius || innerRadius < 0) {
            return 0;
        }
        return innerRadius;
    }

    getOuterRadius() {
        const { outerRadiusRatio, outerRadiusOffset } = this.properties;
        return Math.max(this.radius * outerRadiusRatio + outerRadiusOffset, 0);
    }

    // Placeholder methods to demonstrate concept - in a full implementation,
    // these would be extracted to additional composed utilities

    maybeRefreshNodeData() {
        // Simplified implementation for spike
        if (!this.nodeDataRefresh) return;
        this.nodeDataRefresh = false;
    }

    updateRadiusScale(resize: boolean) {
        const newRange = [this.getInnerRadius(), this.getOuterRadius()];
        this.radiusScale.range = newRange;
        if (resize) {
            this.previousRadiusScale.range = newRange;
        }
    }

    update({ seriesRect }: { seriesRect: BBox }) {
        // Simplified update method for spike demonstration
        const newNodeDataDependencies = {
            seriesRectWidth: seriesRect?.width,
            seriesRectHeight: seriesRect?.height,
        };
        const resize = jsonDiff(this.nodeDataDependencies, newNodeDataDependencies) != null;
        if (resize) {
            this._nodeDataDependencies = newNodeDataDependencies;
        }

        this.maybeRefreshNodeData();
        this.updateRadiusScale(resize);

        this.contentGroup.translationX = this.centerX;
        this.contentGroup.translationY = this.centerY;
        this.highlightGroup.translationX = this.centerX;
        this.highlightGroup.translationY = this.centerY;
        this.backgroundGroup.translationX = this.centerX;
        this.backgroundGroup.translationY = this.centerY;
        if (this.labelGroup) {
            this.labelGroup.translationX = this.centerX;
            this.labelGroup.translationY = this.centerY;
        }
    }

    protected override readonly NodeEvent = PieDonutSeriesNodeEvent;

    protected override pickNodeClosestDatum(point: Point): SeriesNodePickMatch | undefined {
        return pickByMatchingAngle(this, point);
    }

    // Additional methods would be implemented here or delegated to composed utilities
    // This spike demonstrates the key concept of composition over inheritance
}
