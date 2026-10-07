export interface AxisAriaLabelSource {
    axisId: string;
    /** The key the axis is declared under in `axes`. */
    userAxisId: string;
    ariaLabel?: string;
    titleText?: string;
}

export interface AxisAriaLabels {
    labels: Map<string, string>;
    /** Explicit `ariaLabel` values shared by more than one axis; these are used as given. */
    duplicateExplicitLabels: string[];
}

// Accessible names are compared with whitespace trimmed and collapsed; axe's `landmark-unique` rule also ignores case.
const normalise = (label: string) => label.trim().replaceAll(/\s+/g, ' ').toLowerCase();

/**
 * Resolves the accessible name of each axis region: the `ariaLabel` option, else the title text, else the axis key.
 * Derived names (title or key) are made unique within the chart; explicit `ariaLabel` values are never rewritten.
 */
export function resolveAxisAriaLabels(sources: AxisAriaLabelSource[]): AxisAriaLabels {
    const entries = sources.map(({ axisId, userAxisId, ariaLabel, titleText }) => {
        const explicit = ariaLabel != null && ariaLabel.trim() !== '';
        const base = explicit ? ariaLabel : (titleText ?? userAxisId);
        return { axisId, userAxisId, explicit, base, label: base };
    });

    const baseCounts = countBy(entries.map((e) => e.base));
    for (const entry of entries) {
        if (!entry.explicit && baseCounts.get(normalise(entry.base))! > 1) {
            entry.label = `${entry.base} (${entry.userAxisId})`;
        }
    }

    // A suffixed label can still clash, e.g. with a title that is literally `Value (y2)`.
    const labelCounts = countBy(entries.map((e) => e.label));
    const taken = new Set<string>();
    for (const entry of entries) {
        if (entry.explicit || labelCounts.get(normalise(entry.label)) === 1) {
            taken.add(normalise(entry.label));
        }
    }
    for (const entry of entries) {
        if (entry.explicit || labelCounts.get(normalise(entry.label)) === 1) continue;

        let label = entry.userAxisId;
        let n = 2;
        while (taken.has(normalise(label))) {
            label = `${entry.userAxisId} (${n++})`;
        }
        entry.label = label;
        taken.add(normalise(label));
    }

    const explicitCounts = countBy(entries.filter((e) => e.explicit).map((e) => e.base));
    const duplicateExplicitLabels = new Set<string>();
    for (const entry of entries) {
        if (entry.explicit && explicitCounts.get(normalise(entry.base))! > 1) {
            duplicateExplicitLabels.add(entry.base);
        }
    }

    return {
        labels: new Map(entries.map((e) => [e.axisId, e.label])),
        duplicateExplicitLabels: [...duplicateExplicitLabels],
    };
}

function countBy(labels: string[]) {
    const counts = new Map<string, number>();
    for (const label of labels) {
        const key = normalise(label);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}
