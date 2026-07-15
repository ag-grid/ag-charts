import type {
    CollideWith,
    LabelFit,
    LabelPlacement,
    MeasuredLabel,
    NormalisedTextOrSegments,
    PlacedLabel,
    Point,
    PointLabelDatum,
    Writeable,
} from 'ag-charts-core';
import { fitLabelText, isArray, measureTextSegments } from 'ag-charts-core';

import { PointerEvents } from '../../../scene/node';
import type { Text } from '../../../scene/shape/text';
import type { PlacedSeriesLabel } from '../../label';
import { expandLabelPadding, resolvePlacementLabelStyle } from '../../label';
import { getLabelStyles, pickPlacementStyle } from '../../labelUtil';
import type { SeriesNodeDatum } from '../seriesTypes';
import { CartesianSeries } from './cartesianSeries';
import type { CartesianSeriesTypes, DatumOf, LabelOf, LabelSelectionOf } from './cartesianSeriesTypes';

/** The mutable subset of {@link PointLabelDatum} a placed-label series populates on each datum. */
export type MutablePlacedLabelFields = Writeable<Omit<PointLabelDatum, 'point'>>;

/** Label offset applied at a markerless vertex (size 0), where the marker radius can't supply one. */
export const DEFAULT_MARKERLESS_LABEL_GAP = 2;

/** Pre-computed label config a placed-label series caches on its node-data context. */
export interface PlacedLabelContext {
    readonly labelPadding: { left: number; right: number; top: number; bottom: number };
    readonly labelTextMeasurer: { measureLines: (text: string) => { width: number; height: number } };
    readonly labelAvoid: boolean;
    readonly labelPlacements: readonly LabelPlacement[];
    readonly labelMinSpacing: number | undefined;
    readonly labelCollideWith: CollideWith | undefined;
    readonly labelFit: LabelFit | undefined;
    /** Marker-shape rectangle offset for `inside` labels; set only when fitting inside the marker. */
    readonly labelInsideOffset: Point | undefined;
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
        (datum as MutablePlacedLabelFields).placement = placed.placement ?? datum.placement;
        return datum;
    }
    /** Reads the label anchor point from a datum. */
    protected abstract readLabelPoint(datum: LabelOf<TTypes>): Point;
    protected abstract makeLabelFormatterParams(): TTypes['labelParams'];
    /** The series' typed label property; bridges `properties.label` to the shared base generic. */
    protected abstract get labelProperty(): PlacedSeriesLabel<TTypes['labelParams']>;

    protected measureLabel(ctx: PlacedLabelContext, labelText: NormalisedTextOrSegments | undefined): MeasuredLabel {
        if (labelText == null) {
            return { text: '', width: 0, height: 0 };
        }
        const label = this.labelProperty;
        const fittedText = fitLabelText(labelText, ctx.labelFit, label);
        let { width, height } = isArray(fittedText)
            ? measureTextSegments(fittedText, label)
            : ctx.labelTextMeasurer.measureLines(String(fittedText));
        width += ctx.labelPadding.left + ctx.labelPadding.right;
        height += ctx.labelPadding.top + ctx.labelPadding.bottom;
        return { text: fittedText, width, height };
    }

    override getLabelData(): (LabelOf<TTypes> & PointLabelDatum)[] {
        if (!this.isLabelEnabled()) return [];
        return this.contextNodeData?.labelData ?? [];
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

    protected updateHighlightLabelSelection() {
        const highlightedDatum = this.ctx.highlightManager?.getActiveHighlight();
        const highlightItem =
            this.isSeriesHighlighted(highlightedDatum) && highlightedDatum?.datum ? highlightedDatum : undefined;
        const highlightLabelData = highlightItem == null ? [] : (this.getHighlightLabelData([], highlightItem) ?? []);

        this.highlightLabelSelection =
            this.updateLabelSelection({
                labelData: highlightLabelData,
                labelSelection: this.highlightLabelSelection,
            }) ?? this.highlightLabelSelection;

        this.highlightLabelGroup.visible = highlightLabelData.length > 0;
        this.highlightLabelGroup.batchedUpdate(() => {
            this.updateLabelNodes({ labelSelection: this.highlightLabelSelection, isHighlight: true });
        });
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

        opts.labelSelection.each((text, datum) => {
            const placementStyle = pickPlacementStyle(label, datum.placement === 'inside' ? 'inside' : 'outside');
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
                const labelPadding = expandLabelPadding(resolvePlacementLabelStyle(label, placementStyle));
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textBaseline = 'top';
                text.text = datum.label.text;
                text.x = point.x + labelPadding.left;
                text.y = point.y + labelPadding.top;
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
