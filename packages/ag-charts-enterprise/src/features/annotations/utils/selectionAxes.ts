import { type SelectionAxisStyles, createAxisLabelDatum } from '../annotationDatum';

type StatelessAxisStyles = Partial<{
    axisLabel: Partial<SelectionAxisStyles['axisLabel']> & { visible?: string };
    axisShading: object;
}>;

/** Whether axis labels and shading are shown, which depends on whether the annotation is selected. */
export function isShown(visible: SelectionAxisStyles['visible'], selected: boolean) {
    return visible === 'always' || (visible === 'selected' && selected);
}

function isCrossLine(type: string) {
    return type === 'horizontal-line' || type === 'vertical-line';
}

/**
 * Separates the axis styles of an annotation type, which are not applied to its annotations, from its other styles.
 * A horizontal or vertical line's axis label is saved in its state, except for when it shows.
 */
export function splitSelectionAxisStyles(type: string, styles: object) {
    const { axisLabel, axisShading, ...rest } = styles as StatelessAxisStyles & Record<string, unknown>;
    if (axisLabel == null && axisShading == null) return { styles };

    if (isCrossLine(type)) {
        const { visible, ...label } = axisLabel ?? {};
        return {
            styles: Object.keys(label).length > 0 ? { ...rest, axisLabel: label } : rest,
            stateless: { axisLabel: { visible } },
        };
    }
    return { styles: rest, stateless: { axisLabel, axisShading } };
}

export function resolveSelectionAxes(type: string, stateless: object | undefined): SelectionAxisStyles {
    const { axisLabel, axisShading } = (stateless ?? {}) as StatelessAxisStyles;
    const { visible, ...label } = axisLabel ?? {};
    return {
        visible: (visible as SelectionAxisStyles['visible'] | undefined) ?? (isCrossLine(type) ? 'always' : 'selected'),
        // The options have been through the theme by now, so they hold no colour references, which the types allow.
        axisLabel: { ...createAxisLabelDatum(), ...label },
        axisShading: { ...axisShading },
    };
}
