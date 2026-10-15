import {
    type FontOptions,
    type LabelFit,
    type LabelFitDescriptor,
    type LabelFitOptions,
    type LabelStackBlock,
    type NormalisedTextOrSegments,
    resolveLabelFit,
} from 'ag-charts-core';
import type { AgChartLabelCollisionOptions, PaddingOptions } from 'ag-charts-types';

/** The options of a label fitted to the item it sits in: a heatmap cell, treemap tile or sunburst sector. */
export interface AutoSizedLabel extends LabelFitOptions, FontOptions {
    readonly collision?: AgChartLabelCollisionOptions;
}

/**
 * What the placement engine re-fits an auto-sized label's text with. A label that does not fit is hidden,
 * unless `collision.alwaysShow` keeps it, when it is drawn overflowing its item rather than erased.
 */
export function autoSizedLabelFit(
    text: NormalisedTextOrSegments,
    label: AutoSizedLabel,
    boxPadding: Required<PaddingOptions>
): LabelFitDescriptor {
    const alwaysShow = label.collision?.alwaysShow === true;
    const policy: LabelFit = resolveLabelFit(label, !alwaysShow) ?? {};
    return {
        text,
        policy,
        font: label,
        boxPadding,
        boundByRegion: true,
        fitOverflow: alwaysShow ? { wrapping: label.wrapping, overflowStrategy: policy.overflowStrategy } : undefined,
    };
}

/**
 * The blocks of a label drawn above a secondary label. The secondary is given up first for room unless it is
 * always shown, when the label above it is given up instead, unless that is always shown too.
 */
export function labelPairBlocks(primary?: LabelFitDescriptor, secondary?: LabelFitDescriptor): LabelStackBlock[] {
    if (primary == null || secondary == null) {
        const sole = primary ?? secondary;
        return sole == null ? [] : [{ fit: sole }];
    }
    const secondaryAlwaysShows = secondary.fitOverflow != null;
    return [
        { fit: primary, optional: secondaryAlwaysShows && primary.fitOverflow == null },
        { fit: secondary, optional: !secondaryAlwaysShows },
    ];
}
