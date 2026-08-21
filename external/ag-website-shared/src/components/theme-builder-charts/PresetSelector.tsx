import { PresetButton, PresetScroller } from '@ag-website-shared/components/theme-builder/PresetScroller';
import { ResetChangesModal } from '@ag-website-shared/components/theme-builder/ResetChangesModal';
import { getChangedModelItemCount } from '@ag-website-shared/theming/changed-model-items';
import { applyPreset } from '@ag-website-shared/theming/preset';
import { useStore } from 'jotai';
import { useState } from 'react';

import { PresetPreview } from './PresetPreview';
import type { PreviewChartType } from './chartTypes';
import { setStoredPalette } from './paletteModel';
import { type ChartsPreset, PRESETS, paletteFor, themeNameFor, toSharedPreset } from './presets';

interface Props {
    isDark: boolean;
    chartType: PreviewChartType;
    selectedId: string | null;
    onSelect: (preset: ChartsPreset) => void;
}

export const PresetSelector = ({ isDark, chartType, selectedId, onSelect }: Props) => {
    const store = useStore();
    const [showDialog, setShowDialog] = useState(false);
    const [pendingPreset, setPendingPreset] = useState<ChartsPreset | null>(null);

    const apply = (preset: ChartsPreset) => {
        applyPreset(store, toSharedPreset(preset, isDark));
        // The palette is not part of the shared preset, so it is applied here -
        // after applyPreset, which resets the change counter the guard below reads.
        setStoredPalette(store, paletteFor(preset, isDark));
        onSelect(preset);
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
                        <PresetPreview themeName={themeNameFor(preset, isDark)} chartType={chartType} />
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
