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
import { PolarDomainCalculator } from '../utils/domainUtils';
import { EnhancedPolarDataProcessor } from '../utils/enhancedDataUtils';
import type { ProcessedDataValues } from '../utils/interfaces';
import { CategoryLegendProvider } from '../utils/legendUtils';
import { type LabelContext, type NodeDataContext, PolarNodeDataFactory } from '../utils/nodeDataUtils';
import { PolarScaleManager, RadiusCalculationUtils } from '../utils/polarUtils';
import { LegendSymbolStyleManager, PolarStyleManager, type StyleContext } from '../utils/styleUtils';
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
    readonly radius: number;
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
    readonly sectorLabel?: { readonly text: string };
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
    constructor(type: TEvent, nativeEvent: Event, datum: PieDonutNodeDatum, series: PieSeriesComposedRefactored) {
        super(type, nativeEvent, datum, series);
        this.angleKey = series.properties.angleKey;
        this.radiusKey = series.properties.radiusKey;
        this.calloutLabelKey = series.properties.calloutLabelKey;
        this.sectorLabelKey = series.properties.sectorLabelKey;
    }
}

/**
 * Fully refactored PieSeriesComposed using comprehensive utility framework
 *
 * This demonstrates maximum code extraction and reuse through:
 * - Animation lifecycle management
 * - Style calculation and caching
 * - Selection management
 * - Data processing pipelines
 * - Node data creation
 * - Polar-specific utilities
 * - Domain calculation
 */
export class PieSeriesComposedRefactored extends PolarSeries<
    PieDonutNodeDatum,
    AgDonutSeriesOptions,
    DonutSeriesProperties,
    Sector
> {
    static readonly className: string = 'PieSeriesComposedRefactored';
    static readonly type: string = 'pie-composed-refactored';

    override properties = new DonutSeriesProperties();

    // Utility managers - composition over inheritance
    private readonly tooltipProvider: PolarTooltipProvider;
    private readonly legendProvider: CategoryLegendProvider;
    private readonly dataProcessor: EnhancedPolarDataProcessor<PieDonutNodeDatum>;
    private readonly styleManager: PolarStyleManager;
    private readonly nodeDataFactory: PolarNodeDataFactory<PieDonutNodeDatum>;
    private readonly domainCalculator: PolarDomainCalculator;

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

        // Initialize scales using utilities
        this.angleScale = PolarScaleManager.initializeAngleScale();
        this.radiusScale = PolarScaleManager.initializeRadiusScale();

        this.phantomGroup.opacity = 0.2;
        this.innerLabelsGroup.pointerEvents = PointerEvents.None;

        // Initialize all utility managers
        this.tooltipProvider = new PolarTooltipProvider(this as any);
        this.legendProvider = new CategoryLegendProvider(this as any);

        const scaleManager = {
            angleScale: this.angleScale,
            radiusScale: this.radiusScale,
            getSeriesDomain: this.getSeriesDomain.bind(this),
        };

        this.dataProcessor = new EnhancedPolarDataProcessor(this as any, scaleManager);
        this.styleManager = new PolarStyleManager(this.createStyleContext());
        this.nodeDataFactory = new PolarNodeDataFactory(this.createNodeDataContext(), this.createLabelContext());
        this.domainCalculator = new PolarDomainCalculator(this.createDomainContext());
    }

    // Context creation methods for utility managers
    private createStyleContext(): StyleContext {
        return {
            id: this.id,
            properties: this.properties,
            ctx: this.ctx,
            declarationOrder: this.declarationOrder,
            cachedDatumCallback: this.cachedDatumCallback.bind(this),
            callWithContext: this.callWithContext.bind(this),
            getFormatterContext: this.getFormatterContext.bind(this),
            getHighlightStyle: this.getHighlightStyle.bind(this),
            getHighlightStateString: this.getHighlightStateString.bind(this),
        };
    }

    private createNodeDataContext(): NodeDataContext {
        return {
            id: this.id,
            processedData: this.processedData,
            dataModel: this.dataModel,
            angleScale: this.angleScale,
            radiusScale: this.radiusScale,
            visible: this.visible,
            properties: this.properties,
            ctx: this.ctx,
        };
    }

    private createLabelContext(): LabelContext {
        return {
            properties: this.properties,
            getLabels: this.getLabels.bind(this),
            getItemStyle: this.styleManager.getItemStyle.bind(this.styleManager),
        };
    }

    private createDomainContext() {
        return {
            angleScale: this.angleScale,
            radiusScale: this.radiusScale,
            properties: this.properties,
        };
    }

    // Override essential PolarSeries methods with utility delegation
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
        return this.domainCalculator.getSeriesDomain(direction);
    }

    // Delegate core functionality to utility managers
    override async processData(dataController: DataController) {
        return this.dataProcessor.processData(dataController);
    }

    override getTooltipContent(datumIndex: number): TooltipContent | undefined {
        return this.tooltipProvider.getTooltipContent(datumIndex);
    }

    getLegendData(legendType: ChartLegendType): CategoryLegendDatum[] {
        return this.legendProvider.getLegendData(legendType);
    }

    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): ProcessedDataValues {
        return this.dataProcessor.getProcessedDataValues(dataModel, processedData);
    }

    override createNodeData() {
        return this.nodeDataFactory.createNodeData();
    }

    protected hasItemStylers(): boolean {
        return this.styleManager.hasItemStylers();
    }

    // Simplified utility delegation methods
    getItemStyle(datum: { datum: any; datumIndex: number }, isHighlight: boolean): any {
        return this.styleManager.getItemStyle(datum, isHighlight);
    }

    legendItemSymbol(datumIndex: number): any {
        const style = this.getItemStyle(
            { datum: this.processedData?.dataSources.get(this.id)?.[datumIndex], datumIndex },
            false
        );
        return LegendSymbolStyleManager.createLegendSymbolOptions(style, this.properties);
    }

    // Essential radius calculation methods using utilities
    override getInnerRadius() {
        return RadiusCalculationUtils.calculateInnerRadius(
            this.radius,
            this.properties.innerRadiusRatio,
            this.properties.innerRadiusOffset
        );
    }

    getOuterRadius() {
        return RadiusCalculationUtils.calculateOuterRadius(
            this.radius,
            this.properties.outerRadiusRatio,
            this.properties.outerRadiusOffset
        );
    }

    // Simplified update lifecycle using utility managers
    updateRadiusScale(resize: boolean) {
        const newRange = [this.getInnerRadius(), this.getOuterRadius()];
        PolarScaleManager.updateRadiusScaleRange(this.radiusScale, newRange[0], newRange[1]);

        if (resize) {
            PolarScaleManager.updateRadiusScaleRange(this.previousRadiusScale, newRange[0], newRange[1]);
        }
    }

    update({ seriesRect }: { seriesRect: BBox }) {
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

        // Update transformations using utility helpers
        this.updateTransformations();
    }

    private updateTransformations() {
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

    // Add missing getDatumId method for utility compatibility
    getDatumId(datumIndex: number): string {
        return `${datumIndex}`;
    }

    // Simplified placeholder methods for labels (would be extracted to label utilities in full implementation)
    getLabels(_datumIndex: number, _datum: any, _midAngle: number, _span: number, _values: ProcessedDataValues): any {
        return {}; // Simplified for demonstration
    }

    getLabelContent(datumIndex: number, _datum: any, values: any): any {
        return {
            legendItem: values.legendItemValues?.[datumIndex],
            callout: values.calloutLabelValues?.[datumIndex],
            sector: values.sectorLabelValues?.[datumIndex],
        };
    }

    maybeRefreshNodeData() {
        if (!this.nodeDataRefresh) return;
        const result = this.createNodeData();
        if (result) {
            this.nodeData = result.nodeData;
            // Handle phantom data if available
        }
        this.nodeDataRefresh = false;
    }
}
