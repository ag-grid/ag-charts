import styled from '@emotion/styled';
import { Link2, Plus, Trash2, Unlink2 } from 'lucide-react';

import { ColorPicker } from './ColorPicker';
import { FormField } from './FormField';
import {
    PALETTE_ACCENT_KEYS,
    type Palette,
    type PaletteAccent,
    type PaletteAccentKey,
    type SeriesColor,
    deriveStroke,
    fromSeriesColors,
    strokeIsDerived,
    toSeriesColors,
    withAccentColors,
    withAccentFill,
    withAccentStroke,
    withDerivedAccentStroke,
    withDerivedStroke,
    withFill,
    withStroke,
} from './palette';

/**
 * Editor for a chart series palette - see `palette.ts` for why the shape is
 * shared. It is fully controlled: the host owns the state, whether that is a
 * single atom (AG Charts) or a set of numbered theme params (Studio).
 */
export interface PaletteEditorProps {
    value: Palette;
    onChange: (palette: Palette) => void;
    /**
     * Upper bound on series slots, if the host has one. Studio's theme declares a
     * fixed 20 palette params; AG Charts' palette array is unbounded.
     */
    maxSeriesColors?: number;
}

/** A new slot when there is no previous colour to clone - AG Charts' first fill. */
const FALLBACK_SERIES_FILL = '#5090dc';

const ACCENT_LABELS: Record<PaletteAccentKey, string> = {
    up: 'Up',
    down: 'Down',
    neutral: 'Neutral',
};

/**
 * Two colour swatches side by side say nothing about which is which, and the
 * order is not guessable - so every row is headed, and every swatch also names
 * itself for a screen reader, which cannot read a column heading as a label.
 */
const COLUMN_LABELS = ['Fill', 'Stroke'];

export const PaletteEditor = ({ value, onChange, maxSeriesColors }: PaletteEditorProps) => {
    const colors = toSeriesColors(value);
    const canAdd = maxSeriesColors == null || colors.length < maxSeriesColors;

    const setColors = (next: SeriesColor[]) => onChange(fromSeriesColors(value, next));

    const setColor = (index: number, color: SeriesColor) =>
        setColors(colors.map((existing, i) => (i === index ? color : existing)));

    // A new slot copies the last fill and takes the stroke that fill implies,
    // rather than the last stroke: two identical slots are a worse starting
    // point than one that is at least internally consistent.
    const addColor = () => {
        const fill = colors[colors.length - 1]?.fill ?? FALLBACK_SERIES_FILL;
        setColors([...colors, { fill, stroke: deriveStroke(fill), strokeDerived: true }]);
    };

    const removeColor = (index: number) => setColors(colors.filter((_, i) => i !== index));

    return (
        <Fields>
            <FormField
                label="Series Colors"
                docs="Each series takes the next slot, cycling once a chart has more series than the palette. Fills colour the series; strokes outline it, and only appear where the series is drawn with a stroke width. A linked stroke is recoloured whenever its fill changes; setting one by hand unlinks it."
            >
                <Rows>
                    <ColumnHeadings gutter={SERIES_LABEL_WIDTH} />
                    {colors.map((color, index) => (
                        <Row key={index}>
                            <SeriesIndex>{index + 1}</SeriesIndex>
                            <ColorPicker
                                preventTransparency={false}
                                ariaLabel={`Series color ${index + 1} fill`}
                                value={color.fill}
                                onChange={(fill) => setColor(index, withFill(color, fill ?? color.fill))}
                            />
                            <ColorPicker
                                preventTransparency={false}
                                ariaLabel={`Series color ${index + 1} stroke`}
                                value={color.stroke}
                                // Cleared rather than replaced means the user
                                // does not want to choose one, so it goes back
                                // to following the fill. An accent differs -
                                // there, cleared means the accent has no stroke.
                                onChange={(stroke) =>
                                    setColor(
                                        index,
                                        stroke == null ? withDerivedStroke(color, true) : withStroke(color, stroke)
                                    )
                                }
                            />
                            <Controls>
                                <DeriveButton
                                    label={`series color ${index + 1}`}
                                    derived={strokeIsDerived(color.strokeDerived)}
                                    onChange={(derived) => setColor(index, withDerivedStroke(color, derived))}
                                />
                                <IconButton
                                    type="button"
                                    aria-label={`Remove series color ${index + 1}`}
                                    disabled={colors.length <= 1}
                                    onClick={() => removeColor(index)}
                                >
                                    <Trash2 size={14} />
                                </IconButton>
                            </Controls>
                        </Row>
                    ))}
                </Rows>
            </FormField>
            {canAdd && (
                <AddButton type="button" onClick={addColor}>
                    <Plus size={14} /> Add series color
                </AddButton>
            )}
            {/* One group rather than three fields, so the two columns are named
                once and the three rows read as the set they are. */}
            <FormField
                label="Financial Colors"
                docs="Rising, falling and unchanged prices in candlestick and OHLC series. A palette that leaves these unset is treated as an indexed one, and those series fall back to the series colours above."
            >
                <Rows>
                    <ColumnHeadings gutter={ACCENT_LABEL_WIDTH} />
                    {PALETTE_ACCENT_KEYS.map((key) => (
                        <AccentEditor
                            key={key}
                            label={ACCENT_LABELS[key]}
                            value={value[key]}
                            onChange={(accent) => onChange(withAccentColors(value, key, accent))}
                        />
                    ))}
                </Rows>
            </FormField>
        </Fields>
    );
};

/** `gutter` is the width of the row-label column these headings sit beside. */
const ColumnHeadings = ({ gutter }: { gutter: number }) => (
    <Row>
        <RowLabel style={{ width: gutter }} />
        {COLUMN_LABELS.map((label) => (
            <ColumnHeading key={label}>{label}</ColumnHeading>
        ))}
        <Controls>
            <TrailingGutter />
            <TrailingGutter />
        </Controls>
    </Row>
);

interface AccentEditorProps {
    label: string;
    value: PaletteAccent | undefined;
    onChange: (value: PaletteAccent) => void;
}

const AccentEditor = ({ label, value, onChange }: AccentEditorProps) => (
    <Row>
        <RowLabel>{label}</RowLabel>
        <ColorPicker
            preventTransparency={false}
            ariaLabel={`${label} fill`}
            value={value?.fill ?? ''}
            onChange={(fill) => onChange(withAccentFill(value, fill ?? undefined))}
        />
        <ColorPicker
            preventTransparency={false}
            ariaLabel={`${label} stroke`}
            value={value?.stroke ?? ''}
            onChange={(stroke) => onChange(withAccentStroke(value, stroke ?? undefined))}
        />
        <Controls>
            <DeriveButton
                label={label.toLowerCase()}
                derived={strokeIsDerived(value?.strokeDerived)}
                onChange={(derived) => onChange(withDerivedAccentStroke(value, derived))}
            />
            {/* Matches the series rows' remove button, so both groups end flush. */}
            <TrailingGutter />
        </Controls>
    </Row>
);

interface DeriveButtonProps {
    /** What this row is, for the button's own label. */
    label: string;
    derived: boolean;
    onChange: (derived: boolean) => void;
}

/**
 * The switch between a stroke that follows its fill and one the user owns.
 *
 * A toggle rather than a one-way "derive this" action, because the state is
 * worth showing: without it there is no way to tell a stroke that will move with
 * its fill from one that will not, and the two look identical until the moment
 * the fill changes. Editing a stroke by hand flips it off on its own, so this is
 * mostly the way back.
 */
const DeriveButton = ({ label, derived, onChange }: DeriveButtonProps) => (
    <IconButton
        type="button"
        aria-pressed={derived}
        aria-label={`Derive the ${label} stroke from its fill`}
        title={derived ? 'Stroke follows the fill' : 'Stroke was set by hand - link it to the fill'}
        className={derived ? 'is-active' : undefined}
        onClick={() => onChange(!derived)}
    >
        {derived ? <Link2 size={14} /> : <Unlink2 size={14} />}
    </IconButton>
);

/** Enough for "Neutral" at the row font size, and no wider - the panel is 300px. */
const ACCENT_LABEL_WIDTH = 40;
/** Enough for a two-digit slot number. */
const SERIES_LABEL_WIDTH = 16;

const Fields = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Rows = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Row = styled('div')`
    display: flex;
    align-items: center;
    gap: 6px;

    // The two pickers share the row evenly; fill on the left, stroke on the right.
    > div {
        flex: 1;
        min-width: 0;
    }
`;

const RowLabel = styled('span')`
    width: ${ACCENT_LABEL_WIDTH}px;
    flex-shrink: 0;
    color: var(--color-fg-secondary);
    opacity: 0.6;
    font-size: 11px;
`;

// Right-aligned, so the numbers sit against the swatches they belong to rather
// than drifting away from them as the count passes nine.
const SeriesIndex = styled(RowLabel)`
    width: ${SERIES_LABEL_WIDTH}px;
    text-align: right;
`;

const ColumnHeading = styled('span')`
    flex: 1;
    min-width: 0;
    color: var(--color-fg-secondary);
    opacity: 0.6;
    font-size: 11px;
`;

const TrailingGutter = styled('span')`
    width: 14px;
    flex-shrink: 0;
`;

// The row's buttons, kept together and closer to each other than to the pickers
// so they read as one column rather than as two more fields. A span rather than
// a div, or the row's rule for the two pickers would stretch it like a third.
const Controls = styled('span')`
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
`;

const IconButton = styled('button')`
    all: unset;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    color: var(--color-fg-secondary);
    opacity: 0.6;

    &:hover:not(:disabled) {
        opacity: 1;
    }

    &:disabled {
        cursor: default;
        opacity: 0.2;
    }

    // A linked stroke is the default, so it is marked rather than shouted: the
    // unlinked rows are the ones a user is looking for.
    &.is-active {
        opacity: 1;
        color: var(--color-fg-primary);
    }
`;

const AddButton = styled('button')`
    all: unset;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 22px;
    color: var(--color-fg-secondary);
    font-size: 12px;

    &:hover {
        color: var(--color-fg-primary);
    }
`;
