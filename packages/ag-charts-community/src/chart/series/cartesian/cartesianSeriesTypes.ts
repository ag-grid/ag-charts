import type { ChartAxisDirection, Scale, Scaling } from 'ag-charts-core';
import type { AgSeriesSegmentation } from 'ag-charts-types';

import type { BBox } from '../../../scene/bbox';
import type { Node, NodeWithOpacity } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Segment } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import type { ChartAxis } from '../../chartAxis';
import type { DataModelSeriesNodeDataContext, DataModelSeriesNodeDatum } from '../dataModelSeries';
import type { SeriesProperties } from '../seriesProperties';
import type { SeriesNodeDatum } from '../seriesTypes';

// ============================================================================
// Node Datum & Context Types
// ============================================================================
// These are the canonical definitions - cartesianSeries.ts re-exports them.

export interface CartesianSeriesNodeDatum extends DataModelSeriesNodeDatum {
    readonly xKey: string;
    readonly yKey?: string;
    readonly xValue?: any;
    readonly yValue?: any;
}

export interface CartesianSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum = CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
> extends DataModelSeriesNodeDataContext<TDatum, TLabel> {
    scales: { [key in ChartAxisDirection]?: Scaling };
    animationValid?: boolean;
    visible: boolean;
    segments?: Segment[];
}

// ============================================================================
// createNodeData() Context Pattern
// ============================================================================
// Base interface for series context objects used during createNodeData().
// Provides the common shape for incremental update tracking.

/**
 * Rich base context interface for createNodeData() operations.
 * Contains common fields used across all CartesianSeries implementations.
 *
 * Series-specific contexts should extend this interface and add their own fields.
 *
 * @example
 * ```typescript
 * interface BarSeriesNodeDatumContext extends CartesianCreateNodeDataContext<BarNodeDatum> {
 *     readonly barWidth: number;
 *     readonly groupOffset: number;
 *     // ... other bar-specific fields
 * }
 * ```
 */
export interface CartesianCreateNodeDataContext<TDatum extends CartesianSeriesNodeDatum> {
    /** Whether incremental in-place updates are possible for existing nodes */
    readonly canIncrementallyUpdate: boolean;
    /** The node data array being built (may contain existing nodes for reuse) */
    nodes: TDatum[];
    /** Current write position in the nodes array */
    nodeIndex: number;

    // Axes
    readonly xAxis: ChartAxis;
    readonly yAxis: ChartAxis;

    // Scales
    readonly xScale: Scale<any, any>;
    readonly yScale: Scale<any, any>;

    // Data source
    readonly rawData: any[];
    readonly xValues: any[];

    // Property keys
    readonly xKey: string;
    readonly yKey?: string;
    readonly xName?: string;
    readonly yName?: string;

    // Animation flag
    readonly animationEnabled: boolean;
}

/**
 * Specialized context for bar-like series (Bar, Histogram, RangeBar, Waterfall).
 * Adds bar-specific positioning fields.
 */
export interface CartesianBarLikeContext<TDatum extends CartesianSeriesNodeDatum>
    extends CartesianCreateNodeDataContext<TDatum> {
    readonly barWidth: number;
    readonly groupOffset: number;
    readonly crisp: boolean;
}

/**
 * Specialized context for marker-like series (Line, Area, Bubble, Scatter).
 * Adds marker-specific offset fields for band scale positioning.
 */
export interface CartesianMarkerLikeContext<TDatum extends CartesianSeriesNodeDatum>
    extends CartesianCreateNodeDataContext<TDatum> {
    /** X offset for band scale center positioning */
    readonly xOffset: number;
    /** Y offset for band scale center positioning */
    readonly yOffset: number;
}

// ============================================================================
// Properties Interface
// ============================================================================
// Defines the shape of CartesianSeriesProperties for type constraints.
// The actual class with decorators lives in cartesianSeries.ts.

/**
 * Interface defining cartesian-specific properties.
 * CartesianSeriesProperties class implements this interface.
 */
export interface CartesianSeriesPropertiesBase<T extends object> extends SeriesProperties<T> {
    xKeyAxis: string;
    yKeyAxis: string;
    legendItemName?: string;
    pickOutsideVisibleMinorAxis: boolean;
    segmentation: AgSeriesSegmentation;
}

// ============================================================================
// Consolidated Types Interface
// ============================================================================

/**
 * Consolidated type interface for CartesianSeries generic parameters.
 *
 * Instead of passing 7 individual type parameters to CartesianSeries, concrete series
 * define a single interface extending this that specifies all their types:
 *
 * @example
 * ```typescript
 * interface BarSeriesTypes extends CartesianSeriesTypes {
 *     readonly node: BarShape<BarNodeDatum>;
 *     readonly options: AgBarSeriesOptions;
 *     readonly properties: BarSeriesProperties;
 *     readonly datum: BarNodeDatum;
 *     readonly label: BarNodeDatum;
 *     readonly context: BarSeriesNodeDataContext;
 *     readonly stackContext: never;
 * }
 *
 * class BarSeries extends CartesianSeries<BarSeriesTypes> { ... }
 * ```
 */
export interface CartesianSeriesTypes {
    /** Scene graph node type used for rendering data (e.g., Rect, Marker, Path) */
    readonly node: Node<any>;
    /** Series options type from ag-charts-types */
    readonly options: object;
    /** Series properties class extending CartesianSeriesPropertiesBase */
    readonly properties: CartesianSeriesPropertiesBase<this['options']>;
    /** Node datum type containing processed data for rendering */
    readonly datum: CartesianSeriesNodeDatum;
    /** Label datum type (defaults to same as datum in most series) */
    readonly label: SeriesNodeDatum<number>;
    /** Context returned by createNodeData() containing nodeData and labelData arrays */
    readonly context: CartesianSeriesNodeDataContext<this['datum'], this['label']>;
    /** Stack context for stacked series (AreaSeries), never for most series */
    readonly stackContext: any;
    /**
     * Internal context type for createNodeData() operations (template method pattern).
     * Optional to allow incremental migration - defaults to CartesianCreateNodeDataContext<datum>.
     */
    readonly createNodeDataContext?: CartesianCreateNodeDataContext<this['datum']>;
}

// ============================================================================
// Type Extractors
// ============================================================================
// Use these to access individual type members from a CartesianSeriesTypes interface.
// Prefer `NodeOf<TTypes>` over `TTypes['node']` for better readability.

/** Extract the node type from a CartesianSeriesTypes interface */
export type NodeOf<T extends CartesianSeriesTypes> = T['node'];

/** Extract the options type from a CartesianSeriesTypes interface */
export type OptionsOf<T extends CartesianSeriesTypes> = T['options'];

/** Extract the properties type from a CartesianSeriesTypes interface */
export type PropertiesOf<T extends CartesianSeriesTypes> = T['properties'];

/** Extract the datum type from a CartesianSeriesTypes interface */
export type DatumOf<T extends CartesianSeriesTypes> = T['datum'];

/** Extract the label type from a CartesianSeriesTypes interface */
export type LabelOf<T extends CartesianSeriesTypes> = T['label'];

/** Extract the context type from a CartesianSeriesTypes interface */
export type ContextOf<T extends CartesianSeriesTypes> = T['context'];

/** Extract the stack context type from a CartesianSeriesTypes interface */
export type StackContextOf<T extends CartesianSeriesTypes> = T['stackContext'];

/**
 * Extract the createNodeData internal context type from a CartesianSeriesTypes interface.
 * Falls back to CartesianCreateNodeDataContext<datum> if not specified.
 */
export type CreateNodeDataContextOf<T extends CartesianSeriesTypes> = T['createNodeDataContext'] extends undefined
    ? CartesianCreateNodeDataContext<DatumOf<T>>
    : NonNullable<T['createNodeDataContext']>;

// ============================================================================
// Animation Data Types
// ============================================================================
// Type aliases for animation-related types that use the consolidated types interface.

/**
 * Animation data type derived from a CartesianSeriesTypes interface.
 *
 * Use this instead of CartesianAnimationData<TNode, TDatum, TLabel, TContext>
 * when you have a CartesianSeriesTypes interface.
 */
export interface CartesianAnimationDataOf<TTypes extends CartesianSeriesTypes> {
    datumSelection: Selection<NodeOf<TTypes>, DatumOf<TTypes>>;
    labelSelection: Selection<Text, LabelOf<TTypes>>;
    annotationSelections: Selection<NodeWithOpacity, DatumOf<TTypes>>[];
    contextData: ContextOf<TTypes>;
    previousContextData?: ContextOf<TTypes>;
    paths: Path[];
    seriesRect?: BBox;
    duration?: number;
}

/**
 * Selection type for datum nodes derived from a CartesianSeriesTypes interface.
 */
export type DatumSelectionOf<TTypes extends CartesianSeriesTypes> = Selection<NodeOf<TTypes>, DatumOf<TTypes>>;

/**
 * Selection type for label nodes derived from a CartesianSeriesTypes interface.
 */
export type LabelSelectionOf<TTypes extends CartesianSeriesTypes> = Selection<Text, LabelOf<TTypes>>;
