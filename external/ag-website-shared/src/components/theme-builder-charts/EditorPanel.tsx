import { CollapsibleSection } from '@ag-website-shared/components/theme-builder/CollapsibleSection';
import { PaletteEditor } from '@ag-website-shared/components/theme-builder/PaletteEditor';
import { ParamEditor } from '@ag-website-shared/components/theme-builder/ParamEditor';
import {
    horizontalSpacingIcon,
    radiusIcon,
    verticalSpacingIcon,
} from '@ag-website-shared/components/theme-builder/icons';
import { useApplicationConfigAtom } from '@ag-website-shared/theming/application-config';
import styled from '@emotion/styled';
import type { ReactNode } from 'react';

import { usePalette } from './paletteModel';
import { type ChartsParamConfig, type LengthIcon, PARAM_GROUPS } from './params';

const PALETTE_SECTION = 'Palette';

const DEFAULT_OPEN_SECTIONS = [
    PALETTE_SECTION,
    ...PARAM_GROUPS.filter((group) => !group.collapsed).map((group) => group.label),
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
        icon={iconFor(param.icon)}
        swipeAdjustmentDivisor={param.swipeAdjustmentDivisor}
        min={param.min}
        max={param.max}
    />
);

export const EditorPanel = () => {
    const [expanded, setExpanded] = useApplicationConfigAtom('expandedEditors');
    const [palette, setPalette] = usePalette();
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

    return (
        <PanelWrapper>
            {/* Palette leads: for a chart theme it is the change with the most
                visible effect, and unlike the params below it has no default
                surfaced anywhere else in the panel. */}
            <CollapsibleSection {...sectionProps(PALETTE_SECTION)}>
                <PaletteEditor value={palette} onChange={setPalette} />
            </CollapsibleSection>
            {PARAM_GROUPS.map((group) => (
                <CollapsibleSection key={group.id} {...sectionProps(group.label)}>
                    <Fields>{group.params.map(paramEditor)}</Fields>
                </CollapsibleSection>
            ))}
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
