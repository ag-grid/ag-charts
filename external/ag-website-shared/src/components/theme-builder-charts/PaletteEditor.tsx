import { ColorPicker } from '@ag-website-shared/components/theme-builder/ColorPicker';
import { FormField } from '@ag-website-shared/components/theme-builder/FormField';
import styled from '@emotion/styled';
import type { AgPaletteColors } from 'ag-charts-community';
import { Plus, Trash2 } from 'lucide-react';

import { type SeriesColor, fromSeriesColors, toSeriesColors, usePalette, withAccentColors } from './paletteModel';

/**
 * The series palette: the half of an AG Charts theme the shared model has no
 * concept of. Fills and strokes are index-paired, so the editor works in series
 * slots rather than in two parallel lists - reordering or removing a slot keeps
 * the pair together, which is the behaviour a user expects and the one the two
 * arrays silently rely on.
 */
export const PaletteEditor = () => {
    const [palette, setPalette] = usePalette();
    const colors = toSeriesColors(palette);

    const updateColor = (index: number, color: Partial<SeriesColor>) =>
        setPalette(
            fromSeriesColors(
                palette,
                colors.map((c, i) => (i === index ? { ...c, ...color } : c))
            )
        );

    const addColor = () => {
        const last = colors[colors.length - 1] ?? { fill: '#5090dc', stroke: '#2b5c95' };
        setPalette(fromSeriesColors(palette, [...colors, last]));
    };

    const removeColor = (index: number) =>
        setPalette(
            fromSeriesColors(
                palette,
                colors.filter((_, i) => i !== index)
            )
        );

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
            <AddButton type="button" onClick={addColor}>
                <Plus size={14} /> Add series color
            </AddButton>
            {(['up', 'down', 'neutral'] as const).map((key) => (
                <AccentEditor
                    key={key}
                    label={ACCENT_LABELS[key]}
                    value={palette[key]}
                    onChange={(value) => setPalette(withAccentColors(palette, key, value))}
                />
            ))}
        </Fields>
    );
};

const ACCENT_LABELS = {
    up: 'Up (Financial)',
    down: 'Down (Financial)',
    neutral: 'Neutral (Financial)',
} as const;

type AccentEditorProps = {
    label: string;
    value: AgPaletteColors | undefined;
    onChange: (value: AgPaletteColors) => void;
};

const AccentEditor = ({ label, value, onChange }: AccentEditorProps) => (
    <FormField label={label}>
        <Slot>
            <ColorPicker
                preventTransparency={false}
                value={String(value?.fill ?? '')}
                onChange={(fill) => onChange({ ...value, fill: fill ?? undefined })}
            />
            <ColorPicker
                preventTransparency={false}
                value={String(value?.stroke ?? '')}
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
