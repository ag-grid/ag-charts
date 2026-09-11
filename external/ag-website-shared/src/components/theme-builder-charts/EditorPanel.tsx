import { AdvancedParamSelector } from '@ag-website-shared/components/theme-builder/AdvancedParamSelector';
import { CollapsibleSection } from '@ag-website-shared/components/theme-builder/CollapsibleSection';
import { PaletteEditor } from '@ag-website-shared/components/theme-builder/PaletteEditor';
import { ParamEditor } from '@ag-website-shared/components/theme-builder/ParamEditor';
import {
    horizontalSpacingIcon,
    radiusIcon,
    verticalSpacingIcon,
} from '@ag-website-shared/components/theme-builder/icons';
import { useApplicationConfigAtom } from '@ag-website-shared/theming/application-config';
import { useRenderedThemeInfo } from '@ag-website-shared/theming/rendered-theme';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';

import { usePalette } from './paletteModel';
import { type ChartsParamConfig, INHERITED_KEYS, type LengthIcon, PARAM_GROUPS } from './params';

const PALETTE_SECTION = 'Palette';
const ALL_PARAMS_SECTION = 'All Parameters';

const DEFAULT_OPEN_SECTIONS = [
    PALETTE_SECTION,
    ...PARAM_GROUPS.filter((group) => !group.collapsed).map((group) => group.label),
    // Open by default, as in the grid builder: a param pinned here has been asked
    // for explicitly, and a closed section would hide it along with the box.
    ALL_PARAMS_SECTION,
];

const iconFor = (icon?: LengthIcon): ReactNode => {
    switch (icon) {
        case 'radius':
            return radiusIcon;
        case 'verticalSpacing':
            return verticalSpacingIcon;
        case 'horizontalSpacing':
            return horizontalSpacingIcon;
        default:
            return undefined;
    }
};

const paramEditor = (param: ChartsParamConfig) => (
    <ParamEditor
        key={param.key}
        param={param.key}
        label={param.label}
        // The curated labels are short and repeat between sections - three
        // sections have a "Background Color" - so the tooltip carries the part
        // the label leaves out: which of the chart's parts this one paints.
        showDocs
        icon={iconFor(param.icon)}
        swipeAdjustmentDivisor={param.swipeAdjustmentDivisor}
        min={param.min}
        max={param.max}
    />
);

export const EditorPanel = () => {
    const [expanded, setExpanded] = useApplicationConfigAtom('expandedEditors');
    const [palette, setPalette] = usePalette();
    const { overriddenParams } = useRenderedThemeInfo();
    const openSections = expanded || DEFAULT_OPEN_SECTIONS;

    const toggleSection = (heading: string) => {
        setExpanded(
            openSections.includes(heading) ? openSections.filter((h) => h !== heading) : [...openSections, heading]
        );
    };

    const sectionProps = (heading: string) => ({
        heading,
        isOpen: openSections.includes(heading),
        onToggle: () => toggleSection(heading),
    });

    // A param that has been given a value is always shown, whether it inherits
    // or not: that value is the preset's decision or the user's, and one they
    // cannot see is one they cannot undo.
    const isInherited = ({ key }: ChartsParamConfig) => INHERITED_KEYS.has(key) && overriddenParams[key] == null;

    return (
        <PanelWrapper>
            {/* Palette leads: for a chart theme it is the change with the most
                visible effect, and unlike the params below it has no default
                surfaced anywhere else in the panel. */}
            <CollapsibleSection {...sectionProps(PALETTE_SECTION)}>
                <PaletteEditor value={palette} onChange={setPalette} />
            </CollapsibleSection>
            {PARAM_GROUPS.map((group) => {
                const shown = group.params.filter((param) => !isInherited(param));
                // Every param in the group follows another one, so the group has
                // nothing to offer until one of them is asked for by name in the
                // section below - and a heading over an empty body reads as a
                // section that failed to load rather than one with nothing to say.
                if (shown.length === 0) {
                    return null;
                }
                return (
                    <CollapsibleSection key={group.id} {...sectionProps(group.label)}>
                        <Fields>{shown.map(paramEditor)}</Fields>
                    </CollapsibleSection>
                );
            })}
            {/* Last: every param by name, for the ones the curated sections keep
                out of the way, and for anything a section does not name. */}
            <CollapsibleSection {...sectionProps(ALL_PARAMS_SECTION)}>
                <AdvancedParamSelector />
            </CollapsibleSection>
        </PanelWrapper>
    );
};

const PanelWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-bottom: 32px;
`;

const Fields = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;
