import type { Scale } from '../../../scale/scale';
import type { ChartAxisDirection } from '../../chartAxisDirection';
import type { DataController } from '../../data/dataController';
import type { DataModel, ProcessedData } from '../../data/dataModel';
import type { LegendSymbolOptions } from '../../legend/legendSymbol';
import type { TooltipContent } from '../../tooltip/tooltip';
import type { CartesianSeriesNodeDatum } from '../cartesian/cartesianSeries';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';

// Note: SeriesWithFormatterContext is assumed to be available in the implementing series

/**
 * Minimal series context interface for data processing
 */
export interface SeriesDataContext {
    id: string;
    data?: any;
    visible: boolean;
    processedData?: ProcessedData<any>;
    dataModel?: DataModel<any>;
    animationState: {
        transition(state: string): void;
    };
    requestDataModel(dataController: any): Promise<DataModel<any>>;
}

/**
 * Series properties required for data processing
 */
export interface SeriesDataProperties {
    angleKey: string;
    angleName?: string;
    radiusKey?: string;
    radiusName?: string;
    angleFilterKey?: string;
    calloutLabelKey?: string;
    calloutLabelName?: string;
    sectorLabelKey?: string;
    sectorLabelName?: string;
    legendItemKey?: string;
    showInLegend: boolean;
    hideZeroValueSectorsInLegend: boolean;
    title?: {
        showInLegend?: boolean;
        text?: string;
        node: { getPlainText(): string };
    };
    tooltip: any;
}

/**
 * Series context interface for tooltip functionality
 */
export interface SeriesTooltipContext {
    id: string;
    dataModel?: DataModel<any>;
    processedData?: ProcessedData<any>;
    properties: SeriesDataProperties;
    ctx: {
        formatManager: any;
        legendManager?: any; // Made optional to be compatible with legend context
    };
    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): any;
    getLabelContent(datumIndex: number, datum: any, values: any): any;
    getItemStyle(datum: { datum: any; datumIndex: number }, isHighlight: boolean): any;
    legendItemSymbol(datumIndex: number): LegendSymbolOptions;
    formatTooltipWithContext(tooltip: any, content: any, params: any): TooltipContent | undefined;
    // Formatter context methods
    callWithContext?: any;
    getFormatterContext?: (property: string) => any;
}

/**
 * Series context interface for legend functionality
 */
export interface SeriesLegendContext {
    id: string;
    visible: boolean;
    dataModel?: DataModel<any>;
    processedData?: ProcessedData<any>;
    properties: SeriesDataProperties;
    ctx: {
        legendManager: any;
        formatManager?: any; // Made optional to be compatible with tooltip context
    };
    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): any;
    getLabelContent(datumIndex: number, datum: any, values: any): any;
    legendItemSymbol(datumIndex: number): LegendSymbolOptions;
}

/**
 * Complete series context interface that combines all required contexts
 */
export interface SeriesContext extends SeriesDataContext {
    properties: SeriesDataProperties;
    ctx: {
        formatManager: any;
        legendManager: any;
    };
    // Combined methods from all contexts
    getProcessedDataValues(dataModel: DataModel<any>, processedData: ProcessedData<any>): any;
    getLabelContent(datumIndex: number, datum: any, values: any): any;
    getItemStyle(datum: { datum: any; datumIndex: number }, isHighlight: boolean): any;
    legendItemSymbol(datumIndex: number): LegendSymbolOptions;
    formatTooltipWithContext(tooltip: any, content: any, params: any): TooltipContent | undefined;
    callWithContext?: any;
    getFormatterContext?: (property: string) => any;
}

/**
 * Interface for processed data values structure
 */
export interface ProcessedDataValues {
    angleValues: number[];
    angleRawValues: number[];
    angleFilterValues?: number[];
    angleFilterRawValues?: number[];
    radiusValues?: number[];
    radiusRawValues?: number[];
    calloutLabelValues?: string[];
    sectorLabelValues?: string[];
    legendItemValues?: string[];
}

/**
 * Node data creation result interface
 */
export interface NodeDataResult<TDatum extends DataModelSeriesNodeDatum = DataModelSeriesNodeDatum> {
    itemId: string;
    nodeData: TDatum[];
    labelData: TDatum[];
    phantomNodeData?: TDatum[];
}

/**
 * Cartesian series data context interface
 */
export interface CartesianSeriesDataContext {
    id: string;
    data?: any;
    visible: boolean;
    processedData?: ProcessedData<any>;
    dataModel?: DataModel<any>;
    axes: { [key in ChartAxisDirection]?: { scale: Scale<any, any> } };
    seriesGrouping?: { groupIndex?: string; stackCount?: number };
    animationState: {
        transition(state: string): void;
    };
    requestDataModel(
        dataController: DataController,
        data: any,
        options: any
    ): Promise<{ dataModel: DataModel<any>; processedData: ProcessedData<any> }>;
}

/**
 * Cartesian series data properties interface
 */
export interface CartesianSeriesDataProperties {
    xKey: string;
    yKey: string;
    xName?: string;
    yName?: string;
    yFilterKey?: string;
    connectMissingData?: boolean;
    normalizedTo?: number;
    legendItemName?: string;
    showInLegend: boolean;
}

/**
 * Data processor interface for Cartesian series
 */
export interface CartesianDataProcessor {
    processData(
        context: CartesianSeriesDataContext,
        properties: CartesianSeriesDataProperties,
        dataController: DataController
    ): Promise<void>;
}

/**
 * Render strategy interface for series rendering
 */
export interface RenderStrategy<TNode, TContext> {
    createNodes(context: TContext): TNode[];
    updateNodes(nodes: TNode[], context: TContext, visible: boolean): void;
    animateNodes(nodes: TNode[], context: TContext, animationEnabled: boolean): void;
}

/**
 * Interaction handler interface for series interactions
 */
export interface InteractionHandler<TDatum extends CartesianSeriesNodeDatum> {
    computeFocusBounds(opts: any): any;
    pickNode(point: { x: number; y: number }, nodeData: TDatum[]): TDatum | undefined;
    getDistanceToNode(point: { x: number; y: number }, datum: TDatum): number;
}
