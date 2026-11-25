import type {
    BoxBounds,
    CandidateStyleResolver,
    InsideMarkerFit,
    ItemLabelInsets,
    ItemLabelSource,
    LabelMeasureContext,
    MeasuredLabel,
    NormalisedPlacedSeriesLabelOptions,
    NormalisedSeriesMarkerStyle,
    NormalisedTextOrSegments,
    PlacedLabel,
    Point,
    PointLabelDatum,
    SeriesLabelDefaults,
    Text,
    Writeable,
} from 'ag-charts-core';
import {
    PointerEvents,
    applyStyledMarker,
    cachedTextMeasurer,
    drawnStrokeWidth,
    insideMarkerLabelRoom,
    insideMarkerPolicy,
    itemContentInset,
    itemLabelClearance,
    itemLabelInsets,
    lineHeightAtSize,
    markerShapeAnalysis,
    measurePlacedLabel,
    refitItemLabelNode,
    resolveLabelFit,
    resolveSeriesLabelDefaults,
    toArray,
} from 'ag-charts-core';
import type { AgMarkerShape } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../../../core/eventsHub';
import {
    expandPlacementLabelBoxExtent,
    placedLabelTextOffset,
    resolvePlacementLabelStyle,
    styledLabelTextOffset,
} from '../../label';
import {
    compassCandidatePlacement,
    createCandidateStyleResolver,
    getLabelStyles,
    pickPlacementStyle,
    resolveInsidePlacement,
} from '../../labelUtil';
import { Marker } from '../../marker/marker';
import type { SeriesNodeStyleContext } from '../series';
import type { SeriesNodeDatum } from '../seriesTypes';
import { CartesianSeries } from './cartesianSeries';
import type {
    CartesianSeriesNodeDatum,
    CartesianSeriesTypes,
    DatumOf,
    LabelOf,
    LabelSelectionOf,
} from './cartesianSeriesTypes';

/** The mutable subset of {@link PointLabelDatum} a placed-label series populates on each datum. */
export type MutablePlacedLabelFields = Writeable<Omit<PointLabelDatum, 'point'>> & {
    /** The room an inside label was fitted into, so a state drawing its marker with another stroke re-fits it. */
    itemRoom?: ItemLabelSource;
};

/** Pre-computed label config a placed-label series caches on its node-data context. */
export interface PlacedLabelContext extends LabelMeasureContext {
    /** Marker-shape rectangle offset centring an `inside` label; set whenever `inside` is a placement. */
    readonly labelInsideOffset: Point | undefined;
    /** Marker inscribed-rect size for a mixed `inside`+directional list, so an oversized inside candidate cascades. */
    readonly labelInsideSize: { width: number; height: number } | undefined;
    /** Marker anchor, so a label placed on an anchored/off-centre shape (e.g. pin) tracks its drawn centre. */
    readonly labelAnchor: Point | undefined;
    /** Marker shape, so labels avoid each marker's outline rather than its nominal circle. */
    readonly labelMarkerShape: AgMarkerShape | undefined;
    /** Width of the marker's resting stroke, which labels outside the marker clear. */
    readonly labelMarkerStrokeWidth: number;
    /** The series area a directional label must stay inside, unless it may overflow it. */
    readonly labelRegion: BoxBounds | undefined;
}

/** A marker-anchored placed label's series-constant geometry, plus whether it is drawn at all. */
export type MarkerLabelContext = PlacedLabelContext & { readonly labelsEnabled: boolean };

const DISABLED_LABEL_CONTEXT: MarkerLabelContext = {
    labelsEnabled: false,
    labelPadding: { top: 0, right: 0, bottom: 0, left: 0 },
    labelTextMeasurer: { measureLines: () => ({ width: 0, height: 0 }) },
    labelFit: undefined,
    labelFitOverflow: undefined,
    labelStyled: false,
    labelInsideOffset: undefined,
    labelInsideSize: undefined,
    labelAnchor: undefined,
    labelMarkerShape: undefined,
    labelMarkerStrokeWidth: 0,
    labelRegion: undefined,
};

/**
 * Type parameters for a series that renders collision-placed labels. Narrows the base label datum to
 * a {@link PointLabelDatum} (carrying the placed-label fields) and adds the label formatter-params type.
 */
export interface PlacedLabelSeriesTypes extends CartesianSeriesTypes {
    readonly labelParams: object;
    readonly datum: CartesianSeriesNodeDatum & { readonly style?: NormalisedSeriesMarkerStyle };
    readonly label: SeriesNodeDatum &
        PointLabelDatum &
        MutablePlacedLabelFields & {
            readonly labelText?: NormalisedTextOrSegments;
            /** The marker drawn at the label's point. */
            readonly markerDatum?: { readonly style?: NormalisedSeriesMarkerStyle };
        };
}

function setLabelPointerEvents(text: Text) {
    text.pointerEvents = PointerEvents.None;
}

/**
 * Shared base for cartesian series whose labels are positioned by the collision-aware placement engine
 * (line and area). Owns all label measurement, selection and styling; subclasses supply only how a
 * placed `(x, y)` maps onto their datum and the per-series label formatter params.
 */
export abstract class PlacedLabelCartesianSeries<
    TTypes extends PlacedLabelSeriesTypes,
> extends CartesianSeries<TTypes> {
    protected placedLabelData: PlacedLabel<LabelOf<TTypes>>[] = [];

    /** Returns a copy of `datum` with the placed `(x, y)` written onto its label anchor. */
    protected abstract writeLabelPoint(datum: LabelOf<TTypes>, x: number, y: number): LabelOf<TTypes>;

    /** Writes the placed `(x, y)` and the engine's resolved placement onto a copy of the datum. */
    private placedLabelDatum(placed: PlacedLabel<LabelOf<TTypes>>, insets?: ItemLabelInsets): LabelOf<TTypes> {
        const datum = this.writeLabelPoint(placed.datum, placed.x, placed.y);
        const mutable = datum as MutablePlacedLabelFields;
        mutable.placement = placed.placement ?? datum.placement;
        // Only a series whose states restroke its markers keeps rooms, so other labels never grow the property.
        if (insets != null) {
            const { fit } = placed.datum;
            mutable.itemRoom =
                fit == null || placed.placement !== 'inside'
                    ? undefined
                    : insideMarkerLabelRoom(insets, fit, placed.text, placed.fontSize);
        }
        // A re-fitted label is fitted to the candidate the engine chose, so the node must render that text
        // at that size and reserve its box rather than the up-front measurement the cascade started from.
        if (placed.datum.fit != null) {
            mutable.label = {
                text: placed.text,
                width: placed.width,
                height: placed.height,
                fontSize: placed.fontSize,
            };
        }
        return datum;
    }
    /** Reads the label anchor point from a datum. */
    protected abstract readLabelPoint(datum: LabelOf<TTypes>): Point;
    /** The series' `itemPadding`, which labels inside its markers keep from their edges. */
    protected abstract get labelItemPadding(): number;
    /** The marker style each highlight state draws a marker with when nothing restyles it. */
    protected abstract restingMarkerStyles(): SeriesNodeStyleContext<NormalisedSeriesMarkerStyle> | undefined;

    /** The insets labels inside markers keep at rest, when a state can draw the markers with another stroke. */
    private labelItemInsets(): ItemLabelInsets | undefined {
        if (!this.restylesItemStrokes()) return undefined;
        const { stroke, strokeWidth } = this.labelMarker;
        return itemLabelInsets(this.labelItemPadding, stroke, strokeWidth, true);
    }

    /** The style the marker under `datum`'s label is drawn with, as `updateDatumNodes` resolves it. */
    drawnItemStroke(
        datum: LabelOf<TTypes>,
        isHighlight: boolean,
        activeHighlight: HighlightNodeDatum | undefined
    ): NormalisedSeriesMarkerStyle | undefined {
        const marker = isHighlight ? this.highlightDatumAt(datum.datumIndex) : datum.markerDatum;
        const state = this.getHighlightState(activeHighlight, isHighlight, datum.datumIndex);
        return marker?.style ?? this.restingMarkerStyles()?.[state];
    }
    protected abstract makeLabelFormatterParams(): TTypes['labelParams'];
    /** The series' typed label options; bridges the concrete series onto the shared base generic. */
    protected abstract get labelProperty(): NormalisedPlacedSeriesLabelOptions<TTypes['labelParams']>;

    /**
     * Series-constant geometry for a marker-anchored placed label.
     * OPTIMIZATION: a disabled label reaches no consumer, so none of its geometry is resolved.
     */
    protected resolveLabelContext(
        marker: { readonly shape?: AgMarkerShape; readonly stroke?: unknown; readonly strokeWidth?: number },
        markerSize: number,
        itemPadding: number
    ): MarkerLabelContext {
        const label = this.labelProperty;
        if (!label.enabled) return DISABLED_LABEL_CONTEXT;

        const { shape } = marker;
        const markerStrokeWidth = markerSize > 0 ? drawnStrokeWidth(marker.stroke, marker.strokeWidth) : 0;

        const { collision } = label;
        const {
            insideOnly,
            offset: labelInsideOffset,
            size: labelInsideSize,
        } = resolveInsidePlacement(toArray(label.placement), shape);
        const insideFit = insideOnly ? resolveLabelFit(label, false, true) : undefined;
        const labelPadding = expandPlacementLabelBoxExtent(label);
        const insideMarkerFit: InsideMarkerFit | undefined = insideFit
            ? {
                  base: insideFit,
                  threshold: collision.threshold ?? 0,
                  masked: false,
                  clearance: itemLabelClearance(itemContentInset(itemPadding, markerStrokeWidth / 2), labelPadding),
              }
            : undefined;
        return {
            labelsEnabled: true,
            labelPadding,
            labelTextMeasurer: cachedTextMeasurer(label),
            labelFit: insideMarkerFit
                ? insideMarkerPolicy(insideMarkerFit, markerShapeAnalysis(shape), markerSize)
                : resolveLabelFit(label, !collision.alwaysShow),
            labelInsideMarkerFit: insideMarkerFit,
            // Keeps the label on a marker too small to hold even an ellipsis.
            labelFitOverflow: collision.alwaysShow ? insideFit : undefined,
            labelStyled: label.itemStyler != null,
            labelInsideOffset,
            labelInsideSize,
            labelAnchor: Marker.anchor(shape),
            labelMarkerShape: shape,
            labelMarkerStrokeWidth: markerStrokeWidth,
            // Inside-only labels ride with their marker, so only directional placements can spill out.
            labelRegion: insideOnly ? undefined : this.resolveLabelPlotRegion(collision),
        };
    }

    protected measureLabel(ctx: PlacedLabelContext, labelText: NormalisedTextOrSegments | undefined): MeasuredLabel {
        return measurePlacedLabel(labelText, this.labelProperty, ctx);
    }

    /** The series' marker, which its `styler`, `itemStyler` or state may restyle where drawn. */
    protected abstract get labelMarker(): {
        readonly enabled: boolean;
        readonly shape: AgMarkerShape;
        readonly stroke?: unknown;
        readonly strokeWidth?: number;
        readonly itemStyler?: unknown;
    };
    /** The style resolved for the marker drawn at the label's point. */
    protected abstract labelMarkerStyle(
        datum: LabelOf<TTypes>
    ): { readonly size?: number; readonly shape?: AgMarkerShape } | undefined;

    override getLabelData(): (LabelOf<TTypes> & PointLabelDatum)[] {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
    }

    protected override stampLabelMarkers(): boolean {
        const { enabled, itemStyler, shape } = this.labelMarker;
        if (!enabled || !this.isLabelEnabled()) return false;
        const itemStyled = itemStyler != null;
        let changed = false;
        for (const datum of this.contextNodeData?.labelData ?? []) {
            changed = applyStyledMarker(datum, this.labelMarkerStyle(datum), shape, itemStyled) || changed;
        }
        return changed;
    }

    override getLabelDefaults(): SeriesLabelDefaults | undefined {
        const label = this.labelProperty;
        return resolveSeriesLabelDefaults(label.collision, toArray(label.placement), label.spacing);
    }

    override getLabelCandidateStyler(): CandidateStyleResolver | undefined {
        return createCandidateStyleResolver(
            this,
            this.labelProperty,
            this.makeLabelFormatterParams(),
            compassCandidatePlacement
        );
    }

    protected override getHighlightLabelData(
        _labelData: LabelOf<TTypes>[],
        highlightedItem: DatumOf<TTypes>
    ): LabelOf<TTypes>[] | undefined {
        // Source highlight labels from placed positions, not the original vertices, so hover-driven
        // updates match placement (and don't resurface labels the collision pass dropped).
        const insets = this.labelItemInsets();
        const items = this.placedLabelData
            .filter((label) => label.datum.datumIndex === highlightedItem.datumIndex)
            .map((label) => this.placedLabelDatum(label, insets));
        return items.length === 0 ? undefined : items;
    }

    override updatePlacedLabelData(labelData: PlacedLabel<LabelOf<TTypes>>[]) {
        this.placedLabelData = labelData;
        const insets = this.labelItemInsets();
        this.labelSelection.update(
            labelData.map((label) => this.placedLabelDatum(label, insets)),
            setLabelPointerEvents
        );
        this.updateLabelNodes({ labelSelection: this.labelSelection });
        this.updateHighlightLabelSelection();
    }

    protected override updateLabelSelection(opts: {
        labelData: LabelOf<TTypes>[];
        labelSelection: LabelSelectionOf<TTypes>;
    }) {
        return opts.labelSelection.update(opts.labelData, setLabelPointerEvents);
    }

    protected updateLabelNodes(opts: { labelSelection: LabelSelectionOf<TTypes>; isHighlight?: boolean }) {
        // OPTIMIZATION: the placement offsets below resolve the label over every decorated property,
        // so a selection with no labels in it must not pay for them.
        if (opts.labelSelection.length === 0) return;

        const isHighlight = opts.isHighlight ?? false;
        const activeHighlight = this.ctx.highlightManager?.getActiveHighlight();
        const params = this.makeLabelFormatterParams();
        const label = this.labelProperty;
        const insideStyle = pickPlacementStyle(label, 'inside');
        const outsideStyle = pickPlacementStyle(label, 'outside');
        const insideOffset = placedLabelTextOffset(label, insideStyle);
        const outsideOffset = placedLabelTextOffset(label, outsideStyle);
        // A styled label's reservation was sized from the style resolved at its winning placement, so its
        // offset comes from that same style rather than the two placements' shared reservation.
        const styled = label.itemStyler != null;
        // OPTIMIZATION: without a styler the resolved style is datum-independent, so the placement merge
        // is done once per placement here rather than once per label inside `getLabelStyles`.
        const insideLabel = styled ? label : resolvePlacementLabelStyle(label, insideStyle);
        const outsideLabel = styled ? label : resolvePlacementLabelStyle(label, outsideStyle);

        opts.labelSelection.each((text, datum) => {
            const isInside = datum.placement === 'inside';
            const placementStyle = isInside ? insideStyle : outsideStyle;
            const placementOffset = isInside ? insideOffset : outsideOffset;
            const style = getLabelStyles(
                this,
                datum,
                params,
                isInside ? insideLabel : outsideLabel,
                isHighlight,
                activeHighlight,
                undefined,
                styled ? placementStyle : undefined,
                { placement: datum.placement }
            );
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (enabled && datum?.labelText != null && datum.labelText !== '') {
                const point = this.readLabelPoint(datum);
                const offset = styled ? styledLabelTextOffset(style) : placementOffset;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = datum.label.fontSize ?? fontSize;
                text.fontFamily = fontFamily;
                text.lineHeight = lineHeightAtSize(style, datum.label.fontSize);
                text.textBaseline = 'top';
                text.text = datum.label.text;
                text.x = point.x + offset.x;
                text.y = point.y + offset.y;
                text.fill = color;
                text.visible = true;
                text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                if (datum.itemRoom != null) {
                    const drawn = this.drawnItemStroke(datum, isHighlight, activeHighlight);
                    refitItemLabelNode(text, datum.itemRoom, drawn?.stroke, drawn?.strokeWidth, style, 'free');
                }
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }
}
