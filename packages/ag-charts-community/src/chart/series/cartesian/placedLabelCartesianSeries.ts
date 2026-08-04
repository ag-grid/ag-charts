import type {
    CandidateStyleResolver,
    LabelMeasureContext,
    MeasuredLabel,
    NormalisedTextOrSegments,
    PlacedLabel,
    Point,
    PointLabelDatum,
    SeriesLabelDefaults,
    Writeable,
} from 'ag-charts-core';
import { measurePlacedLabel, resolveSeriesLabelDefaults, toArray } from 'ag-charts-core';

import { PointerEvents } from '../../../scene/node';
import type { Text } from '../../../scene/shape/text';
import type { PlacedSeriesLabel } from '../../label';
import { placedLabelTextOffset, styledLabelTextOffset } from '../../label';
import {
    compassCandidatePlacement,
    createCandidateStyleResolver,
    getLabelStyles,
    pickPlacementStyle,
} from '../../labelUtil';
import type { SeriesNodeDatum } from '../seriesTypes';
import { CartesianSeries } from './cartesianSeries';
import type { CartesianSeriesTypes, DatumOf, LabelOf, LabelSelectionOf } from './cartesianSeriesTypes';

/** The mutable subset of {@link PointLabelDatum} a placed-label series populates on each datum. */
export type MutablePlacedLabelFields = Writeable<Omit<PointLabelDatum, 'point'>>;

/** Pre-computed label config a placed-label series caches on its node-data context. */
export interface PlacedLabelContext extends LabelMeasureContext {
    /** Marker-shape rectangle offset centring an `inside` label; set whenever `inside` is a placement. */
    readonly labelInsideOffset: Point | undefined;
    /** Marker inscribed-rect size for a mixed `inside`+directional list, so an oversized inside candidate cascades. */
    readonly labelInsideSize: { width: number; height: number } | undefined;
    /** Marker anchor, so a label placed on an anchored/off-centre shape (e.g. pin) tracks its drawn centre. */
    readonly labelAnchor: Point | undefined;
}

/**
 * Type parameters for a series that renders collision-placed labels. Narrows the base label datum to
 * a {@link PointLabelDatum} (carrying the placed-label fields) and adds the label formatter-params type.
 */
export interface PlacedLabelSeriesTypes extends CartesianSeriesTypes {
    readonly labelParams: object;
    readonly label: SeriesNodeDatum & PointLabelDatum & { readonly labelText?: NormalisedTextOrSegments };
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
    private placedLabelDatum(placed: PlacedLabel<LabelOf<TTypes>>): LabelOf<TTypes> {
        const datum = this.writeLabelPoint(placed.datum, placed.x, placed.y);
        const mutable = datum as MutablePlacedLabelFields;
        mutable.placement = placed.placement ?? datum.placement;
        // A styled label is fitted to the candidate the engine chose, so the node must render that text
        // and reserve its size rather than the up-front measurement the cascade started from.
        if (placed.datum.fit != null) {
            mutable.label = { text: placed.text, width: placed.width, height: placed.height };
        }
        return datum;
    }
    /** Reads the label anchor point from a datum. */
    protected abstract readLabelPoint(datum: LabelOf<TTypes>): Point;
    protected abstract makeLabelFormatterParams(): TTypes['labelParams'];
    /** The series' typed label property; bridges `properties.label` to the shared base generic. */
    protected abstract get labelProperty(): PlacedSeriesLabel<TTypes['labelParams']>;

    protected measureLabel(ctx: PlacedLabelContext, labelText: NormalisedTextOrSegments | undefined): MeasuredLabel {
        return measurePlacedLabel(labelText, this.labelProperty, ctx);
    }

    override getLabelData(): (LabelOf<TTypes> & PointLabelDatum)[] {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
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
        const items = this.placedLabelData
            .filter((label) => label.datum.datumIndex === highlightedItem.datumIndex)
            .map((label) => this.placedLabelDatum(label));
        return items.length === 0 ? undefined : items;
    }

    override updatePlacedLabelData(labelData: PlacedLabel<LabelOf<TTypes>>[]) {
        this.placedLabelData = labelData;
        this.labelSelection.update(
            labelData.map((label) => this.placedLabelDatum(label)),
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

        opts.labelSelection.each((text, datum) => {
            const isInside = datum.placement === 'inside';
            const placementStyle = isInside ? insideStyle : outsideStyle;
            const placementOffset = isInside ? insideOffset : outsideOffset;
            const style = getLabelStyles(
                this,
                datum,
                params,
                label,
                isHighlight,
                activeHighlight,
                undefined,
                placementStyle,
                { placement: datum.placement }
            );
            const { enabled, fontStyle, fontWeight, fontSize, fontFamily, color } = style;
            if (enabled && datum?.labelText) {
                const point = this.readLabelPoint(datum);
                const offset = styled ? styledLabelTextOffset(style) : placementOffset;
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textBaseline = 'top';
                text.text = datum.label.text;
                text.x = point.x + offset.x;
                text.y = point.y + offset.y;
                text.fill = color;
                text.visible = true;
                text.fillOpacity = this.getHighlightStyle(isHighlight, datum.datumIndex).opacity ?? 1;
                text.setBoxing(style);
            } else {
                text.visible = false;
            }
        });
    }
}
