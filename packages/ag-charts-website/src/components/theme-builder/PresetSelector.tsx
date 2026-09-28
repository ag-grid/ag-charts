import { PresetButton, PresetScroller } from '@ag-website-shared/components/theme-builder/PresetScroller';
import { usePresetApply } from '@ag-website-shared/components/theme-builder/usePresetApply';
import { applyPreset } from '@ag-website-shared/theming/preset';
import { useStore } from 'jotai';

import { PresetPreview } from './PresetPreview';
import { completePalette, setStoredPalette } from './paletteModel';
import { setImportedBaseTheme, setSelectedPresetId } from './presetModel';
import { type ChartsPreset, PRESETS, toSharedPreset } from './presets';

interface Props {
    selectedId: string | null | undefined;
}

export const PresetSelector = ({ selectedId }: Props) => {
    const store = useStore();

    const apply = (preset: ChartsPreset) => {
        // Neither the palette nor the base theme is part of the shared preset, so
        // both are applied here - after applyPreset, which resets the change count.
        applyPreset(store, toSharedPreset(preset));
        setStoredPalette(store, completePalette(preset.palette));
        setSelectedPresetId(store, preset.id);
        setImportedBaseTheme(store, undefined);
    };

    const { selectPreset, resetChangesModal } = usePresetApply({ apply });

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
            {resetChangesModal}
        </>
    );
};
