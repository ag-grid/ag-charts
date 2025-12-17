import type { BBox } from '../../../scene/bbox';
import type { Node, NodeWithOpacity } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Path } from '../../../scene/shape/path';
import type { Text } from '../../../scene/shape/text';
import type { SeriesNodeDatum } from '../seriesTypes';
import type {
    CartesianSeriesNodeDataContext,
    CartesianSeriesNodeDatum,
    CartesianSeriesProperties,
} from './cartesianSeries';

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
    /** Series properties class extending CartesianSeriesProperties */
    readonly properties: CartesianSeriesProperties<this['options']>;
    /** Node datum type containing processed data for rendering */
    readonly datum: CartesianSeriesNodeDatum;
    /** Label datum type (defaults to same as datum in most series) */
    readonly label: SeriesNodeDatum<number>;
    /** Context returned by createNodeData() containing nodeData and labelData arrays */
    readonly context: CartesianSeriesNodeDataContext<this['datum'], this['label']>;
    /** Stack context for stacked series (AreaSeries), never for most series */
    readonly stackContext: any;
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

// ============================================================================
// Factory Helper
// ============================================================================
// Use this when you want TypeScript to compute the types interface from individual
// type parameters (useful for applying defaults).

/**
 * Factory type helper to create a CartesianSeriesTypes from individual type parameters.
 *
 * This is useful when you want to leverage TypeScript's default type parameter behavior:
 * - TLabel defaults to TDatum
 * - TContext defaults to CartesianSeriesNodeDataContext<TDatum, TLabel>
 * - TStackContext defaults to never
 *
 * @example
 * ```typescript
 * // Explicit interface (preferred for documentation)
 * interface LineSeriesTypes extends CartesianSeriesTypes { ... }
 *
 * // Using factory (when defaults are sufficient)
 * type LineSeriesTypes = MakeCartesianSeriesTypes<
 *     Marker,
 *     AgLineSeriesOptions,
 *     LineSeriesProperties,
 *     LineNodeDatum
 * >;
 * ```
 */
export type MakeCartesianSeriesTypes<
    TNode extends Node<any>,
    TOpts extends object,
    TProps extends CartesianSeriesProperties<TOpts>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel> = CartesianSeriesNodeDataContext<TDatum, TLabel>,
    TStackContext = never,
> = {
    readonly node: TNode;
    readonly options: TOpts;
    readonly properties: TProps;
    readonly datum: TDatum;
    readonly label: TLabel;
    readonly context: TContext;
    readonly stackContext: TStackContext;
};

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
