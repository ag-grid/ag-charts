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
import styled from '@emotion/styled';
import type { ReactNode } from 'react';

import { InheritedValueNote } from './InheritedValueNote';
import { useSetEditedGroup } from './editedGroup';
import { usePalette } from './paletteModel';
import { type ChartsParamConfig, type LengthIcon, PARAM_GROUPS } from './params';

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
        // Most of these params follow another one, and the editor shows the
        // value that resolves to - so the field says so underneath until the
        // param is given a value of its own.
        note={<InheritedValueNote param={param.key} />}
        icon={iconFor(param.icon)}
        swipeAdjustmentDivisor={param.swipeAdjustmentDivisor}
        min={param.min}
        max={param.max}
    />
);

export const EditorPanel = () => {
    const [expanded, setExpanded] = useApplicationConfigAtom('expandedEditors');
    const [palette, setPalette] = usePalette();
    const setEditedGroup = useSetEditedGroup();
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

    // Which group is being worked in, for the preview to answer with - see
    // `editedGroup.ts`. Capture handlers, so that an interaction inside a group
    // is seen here first and by the group second: the panel clears the group and
    // the group then names itself, and an interaction anywhere else in the panel
    // - another section, its heading, the search box - clears it and stops there.
    //
    // Deliberately no release on blur. A colour picker is rendered in a portal,
    // outside this element, so the moment a swatch was clicked the panel would
    // read as abandoned and the tooltip would close - exactly when the user is
    // dragging a colour they want to see land.
    const releaseGroup = {
        onFocusCapture: () => setEditedGroup(null),
        onPointerDownCapture: () => setEditedGroup(null),
    };
    const holdGroup = (id: string) => ({
        onFocusCapture: () => setEditedGroup(id),
        onPointerDownCapture: () => setEditedGroup(id),
    });

    return (
        <PanelWrapper {...releaseGroup}>
            {/* Palette leads: for a chart theme it is the change with the most
                visible effect, and unlike the params below it has no default
                surfaced anywhere else in the panel. */}
            <CollapsibleSection {...sectionProps(PALETTE_SECTION)}>
                <PaletteEditor value={palette} onChange={setPalette} />
            </CollapsibleSection>
            {/* Every group, and every param in it. A param that follows another
                one is still worth a place: the panel is where you find out what
                a theme can change, and hiding the followers hid three sections
                of it - and with them the fact that a chart has menus, tooltips
                and axes whose colours are yours to set. */}
            {PARAM_GROUPS.map((group) => (
                <CollapsibleSection key={group.id} {...sectionProps(group.label)}>
                    <Fields {...holdGroup(group.id)}>{group.params.map(paramEditor)}</Fields>
                </CollapsibleSection>
            ))}
            {/* Last: the same params, searchable by name or by what they do -
                for finding one without knowing which section holds it. */}
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
