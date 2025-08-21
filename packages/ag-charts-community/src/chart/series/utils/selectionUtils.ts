import type { Group } from '../../../scene/group';
import { PointerEvents } from '../../../scene/node';
import type { Selection } from '../../../scene/selection';
import type { Line } from '../../../scene/shape/line';
import type { Path } from '../../../scene/shape/path';
import type { SegmentedPath } from '../../../scene/shape/segmentedPath';
import type { Text } from '../../../scene/shape/text';
import { createDatumId } from '../../data/processors';
import type { Marker } from '../../marker/marker';
import type { DataModelSeriesNodeDatum } from '../dataModelSeries';

/**
 * Selection context interface
 */
export interface SelectionContext {
    id: string;
    getDatumId(datumIndex: number): string;
    ctx: {
        animationManager: {
            isSkipped(): boolean;
        };
    };
}

/**
 * Node tag enumeration for different node types
 */
export enum PolarNodeTag {
    CalloutLine = 'CalloutLine',
    CalloutLabel = 'CalloutLabel',
    SectorLabel = 'SectorLabel',
    InnerLabel = 'InnerLabel',
}

/**
 * Selection management utilities for polar series
 */
export class PolarSelectionManager<TDatum extends DataModelSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update datum selection with proper data binding
     */
    updateDatumSelection<TNode>(
        selection: Selection<TNode, TDatum>,
        nodeData: TDatum[],
        nodeFactory?: () => TNode
    ): void {
        selection.update(nodeData, nodeFactory, (datum) => this.context.getDatumId(datum.datumIndex));

        if (this.context.ctx.animationManager.isSkipped()) {
            selection.cleanup();
        }
    }

    /**
     * Update multiple selections with the same data
     */
    updateMultipleSelections<TNode>(
        selections: Array<Selection<TNode, TDatum>>,
        nodeData: TDatum[],
        nodeFactory?: () => TNode
    ): void {
        selections.forEach((selection) => {
            this.updateDatumSelection(selection, nodeData, nodeFactory);
        });
    }

    /**
     * Update highlighted selection with cloned style data
     */
    updateHighlightSelection<TNode>(selection: Selection<TNode, TDatum>, nodeData: TDatum[]): void {
        const highlightedNodeData = nodeData.map((datum) => ({
            ...datum,
            // Allow mutable sectorFormat, so formatted sector styles can be updated and varied
            // between normal and highlighted cases.
            sectorFormat: { ...datum.sectorFormat },
        }));

        this.updateDatumSelection(selection, highlightedNodeData as TDatum[]);
    }
}

/**
 * Callout label selection management
 */
export class CalloutLabelSelectionManager<TDatum extends DataModelSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update callout label selection with line and text nodes
     */
    updateCalloutLabelSelection(selection: Selection<Group, TDatum>, nodeData: TDatum[]): void {
        selection.update(nodeData, (group) => {
            // Create line for callout
            const line = new Line();
            line.tag = PolarNodeTag.CalloutLine;
            line.pointerEvents = PointerEvents.None;
            group.appendChild(line);

            // Create text for label
            const text = new Text();
            text.tag = PolarNodeTag.CalloutLabel;
            text.pointerEvents = PointerEvents.None;
            group.appendChild(text);
        });
    }

    /**
     * Get callout lines from selection
     */
    getCalloutLines(selection: Selection<Group, TDatum>): Line[] {
        return selection.selectByTag<Line>(PolarNodeTag.CalloutLine);
    }

    /**
     * Get callout texts from selection
     */
    getCalloutTexts(selection: Selection<Group, TDatum>): Text[] {
        return selection.selectByTag<Text>(PolarNodeTag.CalloutLabel);
    }
}

/**
 * Inner circle selection management
 */
export class InnerCircleSelectionManager {
    /**
     * Update inner circle selection
     */
    updateInnerCircleSelection(
        selection: Selection<Marker, { radius: number }>,
        innerRadius: number,
        outerRadius: number,
        hasInnerCircle: boolean
    ): void {
        let radius = 0;
        if (innerRadius > 0 && hasInnerCircle) {
            const circleRadius = Math.min(innerRadius, outerRadius);
            const antiAliasingPadding = 1;
            radius = Math.ceil(circleRadius * 2 + antiAliasingPadding);
        }

        const datums = hasInnerCircle ? [{ radius }] : [];
        selection.update(datums);
    }
}

/**
 * Label selection management utilities
 */
export class LabelSelectionManager<TDatum extends DataModelSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update sector label selection
     */
    updateSectorLabelSelection(selection: Selection<Text, TDatum>, nodeData: TDatum[]): void {
        selection.update(nodeData, (node) => {
            node.tag = PolarNodeTag.SectorLabel;
            node.pointerEvents = PointerEvents.None;
        });
    }

    /**
     * Update inner label selection
     */
    updateInnerLabelSelection<TInnerLabel>(selection: Selection<Text, TInnerLabel>, innerLabels: TInnerLabel[]): void {
        selection.update(innerLabels, (node) => {
            node.tag = PolarNodeTag.InnerLabel;
            node.pointerEvents = PointerEvents.None;
        });
    }
}

/**
 * Selection cleanup utilities
 */
export class SelectionCleanupManager {
    /**
     * Clean up selection if animations are disabled
     */
    static cleanupSelection<TNode, TDatum>(
        selection: Selection<TNode, TDatum>,
        animationManager: { isSkipped(): boolean }
    ): void {
        if (animationManager.isSkipped()) {
            selection.cleanup();
        }
    }

    /**
     * Clean up multiple selections
     */
    static cleanupSelections<TNode, TDatum>(
        selections: Array<Selection<TNode, TDatum>>,
        animationManager: { isSkipped(): boolean }
    ): void {
        if (animationManager.isSkipped()) {
            selections.forEach((selection) => selection.cleanup());
        }
    }

    /**
     * Force cleanup all selections
     */
    static forceCleanupSelections<TNode, TDatum>(selections: Array<Selection<TNode, TDatum>>): void {
        selections.forEach((selection) => selection.cleanup());
    }
}

/**
 * Selection visibility management
 */
export class SelectionVisibilityManager {
    /**
     * Update selection visibility based on conditions
     */
    static updateSelectionVisibility<TNode extends { visible: boolean }, TDatum>(
        selection: Selection<TNode, TDatum>,
        isVisible: boolean,
        visibilityPredicate?: (node: TNode, datum: TDatum, index: number) => boolean
    ): void {
        selection.each((node, datum, index) => {
            if (visibilityPredicate) {
                node.visible = isVisible && visibilityPredicate(node, datum, index);
            } else {
                node.visible = isVisible;
            }
        });
    }

    /**
     * Update highlight selection visibility
     */
    static updateHighlightVisibility<TNode extends { visible: boolean }, TDatum extends { itemId?: any }>(
        selection: Selection<TNode, TDatum>,
        isVisible: boolean,
        highlightedItemId: any
    ): void {
        selection.each((node, datum) => {
            node.visible = isVisible && datum.itemId === highlightedItemId;
        });
    }
}

/**
 * Cartesian series node datum interface
 */
export interface CartesianSeriesNodeDatum extends DataModelSeriesNodeDatum {
    readonly xValue: any;
    readonly yValue?: any;
    readonly point?: { x: number; y: number };
}

/**
 * Cartesian selection management utilities
 */
export class CartesianSelectionManager<TDatum extends CartesianSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update datum selection for markers/shapes
     */
    updateDatumSelection<TNode>(
        selection: Selection<TNode, TDatum>,
        nodeData: TDatum[],
        nodeFactory?: () => TNode,
        keyFn?: (datum: TDatum) => string
    ): Selection<TNode, TDatum> {
        const keyFunction = keyFn || ((datum: TDatum) => createDatumId(datum.xValue));
        const result = selection.update(nodeData, nodeFactory, keyFunction);

        if (this.context.ctx.animationManager.isSkipped()) {
            selection.cleanup();
        }

        return result;
    }

    /**
     * Update path selection for line/area series
     */
    updatePathSelection(
        selection: Selection<Path | SegmentedPath, any>,
        pathData: any[],
        nodeFactory?: () => Path | SegmentedPath
    ): void {
        selection.update(pathData, nodeFactory);

        if (this.context.ctx.animationManager.isSkipped()) {
            selection.cleanup();
        }
    }

    /**
     * Update label selection with proper data binding
     */
    updateLabelSelection<TNode extends Text>(
        selection: Selection<TNode, TDatum>,
        labelData: TDatum[],
        isEnabled: boolean,
        nodeFactory?: () => TNode
    ): Selection<TNode, TDatum> {
        const data = isEnabled ? labelData : [];
        return selection.update(data, nodeFactory, (datum) => createDatumId(datum.xValue));
    }

    /**
     * Batch update multiple selections with same data
     */
    updateMultipleSelections<TNode>(
        selections: Array<Selection<TNode, TDatum>>,
        nodeData: TDatum[],
        nodeFactory?: () => TNode
    ): void {
        selections.forEach((selection) => {
            this.updateDatumSelection(selection, nodeData, nodeFactory);
        });
    }
}

/**
 * Cartesian path selection management
 */
export class CartesianPathSelectionManager {
    /**
     * Update segmented path selection for complex paths
     */
    static updateSegmentedPathSelection(
        selection: Selection<SegmentedPath, any>,
        segments: any[],
        nodeFactory?: () => SegmentedPath
    ): void {
        selection.update(segments, nodeFactory);
    }

    /**
     * Update path nodes with stroke data
     */
    static updatePathNodes<TData>(
        pathSelection: Selection<Path, TData>,
        strokeData: TData[],
        applyStyles: (path: Path, data: TData) => void
    ): void {
        pathSelection.each((path, data) => {
            applyStyles(path, data);
        });
    }

    /**
     * Clear path selections when series is hidden
     */
    static clearPathSelections(...selections: Array<Selection<Path | SegmentedPath, any>>): void {
        selections.forEach((selection) => {
            selection.clear();
            selection.cleanup();
        });
    }
}

/**
 * Cartesian marker selection management
 */
export class CartesianMarkerSelectionManager<TDatum extends CartesianSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update marker selection with cross-filtering support
     */
    updateMarkerSelection(
        selection: Selection<Marker, TDatum>,
        nodeData: TDatum[],
        markersEnabled: boolean,
        crossFiltering: boolean = false
    ): Selection<Marker, TDatum> {
        // Show markers if explicitly enabled or if cross-filtering is active
        const data = markersEnabled || crossFiltering ? nodeData : [];

        return selection.update(data, undefined, (datum) => createDatumId(datum.xValue));
    }

    /**
     * Update marker selection with clean up when marker config changes
     */
    updateMarkerSelectionWithCleanup(
        selection: Selection<Marker, TDatum>,
        nodeData: TDatum[],
        markersEnabled: boolean,
        markerDirty: boolean
    ): Selection<Marker, TDatum> {
        if (markerDirty) {
            selection.clear();
            selection.cleanup();
        }

        return this.updateMarkerSelection(selection, nodeData, markersEnabled);
    }

    /**
     * Apply styles to marker selection
     */
    applyMarkerStyles(
        selection: Selection<Marker, TDatum>,
        getStyle: (datum: TDatum, index: number) => any,
        applyPosition: boolean = true
    ): void {
        selection.each((marker, datum, index) => {
            if (!selection.isGarbage(marker)) {
                const style = getStyle(datum, index);
                this.applyMarkerStyle(marker, style, datum, applyPosition);
            }
        });
    }

    private applyMarkerStyle(marker: Marker, style: any, datum: TDatum, applyPosition: boolean): void {
        // Apply visual style properties
        if (style.fill !== undefined) marker.fill = style.fill;
        if (style.fillOpacity !== undefined) marker.fillOpacity = style.fillOpacity;
        if (style.stroke !== undefined) marker.stroke = style.stroke;
        if (style.strokeWidth !== undefined) marker.strokeWidth = style.strokeWidth;
        if (style.strokeOpacity !== undefined) marker.strokeOpacity = style.strokeOpacity;
        if (style.size !== undefined) marker.size = style.size;
        if (style.shape !== undefined) marker.shape = style.shape;

        // Apply position if needed
        if (applyPosition && datum.point) {
            marker.translationX = datum.point.x;
            marker.translationY = datum.point.y;
        }

        // Apply visibility
        marker.visible = style.visible !== false;
    }
}

/**
 * Cartesian label selection management
 */
export class CartesianLabelSelectionManager<TDatum extends CartesianSeriesNodeDatum> {
    constructor(private readonly context: SelectionContext) {}

    /**
     * Update label selection with enabled check
     */
    updateLabelSelection(
        selection: Selection<Text, TDatum>,
        labelData: TDatum[],
        isEnabled: boolean
    ): Selection<Text, TDatum> {
        const data = isEnabled ? labelData : [];
        return selection.update(data, undefined, (datum) => createDatumId(datum.xValue));
    }

    /**
     * Apply label styles and positioning
     */
    applyLabelStyles(
        selection: Selection<Text, TDatum>,
        getLabelText: (datum: TDatum) => string | undefined,
        getStyle: (datum: TDatum) => any,
        getPosition: (datum: TDatum) => { x: number; y: number }
    ): void {
        selection.each((text, datum) => {
            const labelText = getLabelText(datum);
            const style = getStyle(datum);
            const position = getPosition(datum);

            if (labelText && style.enabled) {
                text.text = labelText;
                text.x = position.x;
                text.y = position.y;

                // Apply text style properties
                text.fontStyle = style.fontStyle;
                text.fontWeight = style.fontWeight;
                text.fontSize = style.fontSize;
                text.fontFamily = style.fontFamily;
                text.fill = style.color;
                text.fillOpacity = style.fillOpacity || 1;

                // Apply text alignment
                text.textAlign = style.textAlign || 'center';
                text.textBaseline = style.textBaseline || 'middle';

                text.visible = true;
            } else {
                text.visible = false;
            }
        });
    }
}

/**
 * Selection update orchestrator for polar series
 */
export class SelectionUpdateOrchestrator<TDatum extends DataModelSeriesNodeDatum> {
    private readonly selectionManager: PolarSelectionManager<TDatum>;
    private readonly calloutManager: CalloutLabelSelectionManager<TDatum>;
    private readonly labelManager: LabelSelectionManager<TDatum>;

    constructor(context: SelectionContext) {
        this.selectionManager = new PolarSelectionManager(context);
        this.calloutManager = new CalloutLabelSelectionManager(context);
        this.labelManager = new LabelSelectionManager(context);
    }

    /**
     * Update all selections in proper order
     */
    updateAllSelections(
        selections: {
            itemSelection: Selection<any, TDatum>;
            highlightSelection: Selection<any, TDatum>;
            phantomSelection: Selection<any, TDatum>;
            calloutLabelSelection: Selection<Group, TDatum>;
            labelSelection: Selection<Text, TDatum>;
            innerLabelsSelection: Selection<Text, any>;
        },
        nodeData: TDatum[],
        innerLabels: any[] = []
    ): void {
        // Update main item selections
        this.selectionManager.updateDatumSelection(selections.itemSelection, nodeData);
        this.selectionManager.updateHighlightSelection(selections.highlightSelection, nodeData);
        this.selectionManager.updateDatumSelection(selections.phantomSelection, nodeData);

        // Update label selections
        this.calloutManager.updateCalloutLabelSelection(selections.calloutLabelSelection, nodeData);
        this.labelManager.updateSectorLabelSelection(selections.labelSelection, nodeData);
        this.labelManager.updateInnerLabelSelection(selections.innerLabelsSelection, innerLabels);
    }
}

/**
 * Cartesian selection update orchestrator
 */
export class CartesianSelectionUpdateOrchestrator<TDatum extends CartesianSeriesNodeDatum> {
    private readonly selectionManager: CartesianSelectionManager<TDatum>;
    private readonly markerManager: CartesianMarkerSelectionManager<TDatum>;
    private readonly labelManager: CartesianLabelSelectionManager<TDatum>;

    constructor(context: SelectionContext) {
        this.selectionManager = new CartesianSelectionManager(context);
        this.markerManager = new CartesianMarkerSelectionManager(context);
        this.labelManager = new CartesianLabelSelectionManager(context);
    }

    /**
     * Update all Cartesian selections
     */
    updateAllSelections(
        selections: {
            datumSelection: Selection<Marker, TDatum>;
            pathSelection?: Selection<Path | SegmentedPath, any>;
            labelSelection: Selection<Text, TDatum>;
            annotationSelections?: Selection<Text, any>[];
        },
        data: {
            nodeData: TDatum[];
            labelData: TDatum[];
            pathData?: any[];
        },
        config: {
            markersEnabled: boolean;
            labelsEnabled: boolean;
            markerDirty?: boolean;
            crossFiltering?: boolean;
        }
    ): void {
        // Update marker selection
        this.markerManager.updateMarkerSelectionWithCleanup(
            selections.datumSelection,
            data.nodeData,
            config.markersEnabled,
            config.markerDirty || false
        );

        // Update path selection if provided
        if (selections.pathSelection && data.pathData) {
            this.selectionManager.updatePathSelection(selections.pathSelection, data.pathData);
        }

        // Update label selections
        this.labelManager.updateLabelSelection(selections.labelSelection, data.labelData, config.labelsEnabled);

        // Update annotation selections if provided
        if (selections.annotationSelections) {
            selections.annotationSelections.forEach((annotationSelection) => {
                annotationSelection.update([]);
            });
        }
    }
}
