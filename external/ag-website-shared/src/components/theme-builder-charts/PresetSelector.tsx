import { PresetButton, PresetScroller } from '@ag-website-shared/components/theme-builder/PresetScroller';
import { ResetChangesModal } from '@ag-website-shared/components/theme-builder/ResetChangesModal';
import { getChangedModelItemCount } from '@ag-website-shared/theming/changed-model-items';
import { applyPreset } from '@ag-website-shared/theming/preset';
import { useStore } from 'jotai';
import { useState } from 'react';

import { PresetPreview } from './PresetPreview';
import { setStoredPalette } from './paletteModel';
import { setSelectedPresetId } from './presetModel';
import { type ChartsPreset, PRESETS, toSharedPreset } from './presets';

interface Props {
    selectedId: string | undefined;
}

export const PresetSelector = ({ selectedId }: Props) => {
    const store = useStore();
    const [showDialog, setShowDialog] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<ChartsPreset | null>(null);

    const apply = (preset: ChartsPreset) => {
        applyPreset(store, toSharedPreset(preset));
        // Neither the palette nor the base theme is part of the shared preset,
        // so both are applied here - after applyPreset, which resets the change
        // counter the guard below reads.
        setStoredPalette(store, preset.palette);
        setSelectedPresetId(store, preset.id);
    };

    const selectPreset = (preset: ChartsPreset) => {
        // Only warn about losing manual edits; a single change is the preset
        // application itself, mirroring the other hosts' threshold.
        if (getChangedModelItemCount(store) > 1) {
            setPendingPreset(preset);
            setShowDialog(true);
        } else {
            apply(preset);
        }
    };

    return (
        <>
            <PresetScroller>
                {PRESETS.map((preset) => (
                    <PresetButton
                        key={preset.id}
                        onClick={(e) => {
                            selectPreset(preset);
                            e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                        }}
                        aria-label={preset.label}
                        aria-pressed={preset.id === selectedId}
                    >
                        <PresetPreview preset={preset} />
                    </PresetButton>
                ))}
            </PresetScroller>
            {pendingPreset && (
                <ResetChangesModal
                    showDialog={showDialog}
                    setShowDialog={setShowDialog}
                    onSuccess={() => apply(pendingPreset)}
                />
            )}
        </>
    );
};
