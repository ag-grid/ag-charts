import styled from '@emotion/styled';
import { Plus, Trash2 } from 'lucide-react';

import { ColorPicker } from './ColorPicker';
import { FormField } from './FormField';
import {
    PALETTE_ACCENT_KEYS,
    type Palette,
    type PaletteAccent,
    type PaletteAccentKey,
    type SeriesColor,
    fromSeriesColors,
    toSeriesColors,
    withAccentColors,
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
const FALLBACK_SERIES_COLOR: SeriesColor = { fill: '#5090dc', stroke: '#2b5c95' };

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

    const updateColor = (index: number, color: Partial<SeriesColor>) =>
        setColors(colors.map((c, i) => (i === index ? { ...c, ...color } : c)));

    const addColor = () => setColors([...colors, colors[colors.length - 1] ?? FALLBACK_SERIES_COLOR]);

    const removeColor = (index: number) => setColors(colors.filter((_, i) => i !== index));

    return (
        <Fields>
            <FormField
                label="Series Colors"
                docs="Each series takes the next slot, cycling once a chart has more series than the palette. Fills colour the series; strokes outline it, and only appear where the series is drawn with a stroke width."
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
                                onChange={(fill) => updateColor(index, { fill: fill ?? color.fill })}
                            />
                            <ColorPicker
                                preventTransparency={false}
                                ariaLabel={`Series color ${index + 1} stroke`}
                                value={color.stroke}
                                onChange={(stroke) => updateColor(index, { stroke: stroke ?? color.stroke })}
                            />
                            <IconButton
                                type="button"
                                aria-label={`Remove series color ${index + 1}`}
                                disabled={colors.length <= 1}
                                onClick={() => removeColor(index)}
                            >
                                <Trash2 size={14} />
                            </IconButton>
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
        <TrailingGutter />
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
            onChange={(fill) => onChange({ ...value, fill: fill ?? undefined })}
        />
        <ColorPicker
            preventTransparency={false}
            ariaLabel={`${label} stroke`}
            value={value?.stroke ?? ''}
            onChange={(stroke) => onChange({ ...value, stroke: stroke ?? undefined })}
        />
        {/* Matches the series rows' remove button, so both groups end flush. */}
        <TrailingGutter />
    </Row>
);

/** Enough for "Neutral" at the row font size, and no wider - the panel is 300px. */
const ACCENT_LABEL_WIDTH = 44;
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
