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
    up: 'Up (Financial)',
    down: 'Down (Financial)',
    neutral: 'Neutral (Financial)',
};

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
            <FormField label="Series Colors">
                <Slots>
                    {colors.map((color, index) => (
                        <Slot key={index}>
                            <SlotIndex>{index + 1}</SlotIndex>
                            <ColorPicker
                                preventTransparency={false}
                                value={color.fill}
                                onChange={(fill) => updateColor(index, { fill: fill ?? color.fill })}
                            />
                            <ColorPicker
                                preventTransparency={false}
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
                        </Slot>
                    ))}
                </Slots>
            </FormField>
            {canAdd && (
                <AddButton type="button" onClick={addColor}>
                    <Plus size={14} /> Add series color
                </AddButton>
            )}
            {PALETTE_ACCENT_KEYS.map((key) => (
                <AccentEditor
                    key={key}
                    label={ACCENT_LABELS[key]}
                    value={value[key]}
                    onChange={(accent) => onChange(withAccentColors(value, key, accent))}
                />
            ))}
        </Fields>
    );
};

interface AccentEditorProps {
    label: string;
    value: PaletteAccent | undefined;
    onChange: (value: PaletteAccent) => void;
}

const AccentEditor = ({ label, value, onChange }: AccentEditorProps) => (
    <FormField label={label}>
        <Slot>
            <ColorPicker
                preventTransparency={false}
                value={value?.fill ?? ''}
                onChange={(fill) => onChange({ ...value, fill: fill ?? undefined })}
            />
            <ColorPicker
                preventTransparency={false}
                value={value?.stroke ?? ''}
                onChange={(stroke) => onChange({ ...value, stroke: stroke ?? undefined })}
            />
        </Slot>
    </FormField>
);

const Fields = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const Slots = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const Slot = styled('div')`
    display: flex;
    align-items: center;
    gap: 6px;

    // The two pickers share the row evenly; fill on the left, stroke on the right.
    > div {
        flex: 1;
        min-width: 0;
    }
`;

const SlotIndex = styled('span')`
    width: 16px;
    flex-shrink: 0;
    color: var(--color-fg-secondary);
    opacity: 0.6;
    font-size: 11px;
    text-align: right;
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
