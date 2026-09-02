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
import { type ReactNode, useState } from 'react';

import { usePalette } from './paletteModel';
import { type ChartsParamConfig, INHERITED_KEYS, type LengthIcon, PARAM_GROUPS } from './params';

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
    const { overriddenParams } = useRenderedThemeInfo();
    // Not persisted, unlike which sections are open: revealing the params behind
    // a group is asking a question of the theme, not arranging the panel.
    const [revealedGroups, setRevealedGroups] = useState<string[]>([]);
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

    const toggleRevealed = (id: string) =>
        setRevealedGroups(
            revealedGroups.includes(id) ? revealedGroups.filter((other) => other !== id) : [...revealedGroups, id]
        );

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
                const inherited = group.params.filter(isInherited);
                const isRevealed = revealedGroups.includes(group.id);
                return (
                    <CollapsibleSection key={group.id} {...sectionProps(group.label)}>
                        <Fields>
                            {(isRevealed ? group.params : group.params.filter((param) => !isInherited(param))).map(
                                paramEditor
                            )}
                            {inherited.length > 0 && (
                                <RevealButton type="button" onClick={() => toggleRevealed(group.id)}>
                                    {isRevealed ? 'Hide inherited' : `Show ${inherited.length} inherited`}
                                </RevealButton>
                            )}
                        </Fields>
                    </CollapsibleSection>
                );
            })}
        </PanelWrapper>
    );
};

const PanelWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-bottom: 32px;
`;

// The design system dresses a bare `button` as a filled primary button through
// rules that each carry a pseudo-class, which outrank the single class Emotion
// generates; tripling the class outranks them back. Same as `PaletteEditor`.
const RevealButton = styled('button')`
    &&& {
        all: unset;
        cursor: pointer;
        align-self: flex-start;
        color: var(--color-fg-secondary);
        font-size: 12px;
        opacity: 0.8;

        &:hover {
            color: var(--color-fg-primary);
            opacity: 1;
        }

        &:focus-visible {
            outline: 2px solid var(--color-brand-500);
            outline-offset: 2px;
            border-radius: 2px;
        }
    }
`;

const Fields = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;
