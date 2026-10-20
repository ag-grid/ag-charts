import { AdvancedParamSelector } from '@ag-website-shared/components/theme-builder/AdvancedParamSelector';
import { CollapsibleSection } from '@ag-website-shared/components/theme-builder/CollapsibleSection';
import { PaletteEditor } from '@ag-website-shared/components/theme-builder/PaletteEditor';
import { ParamEditor } from '@ag-website-shared/components/theme-builder/ParamEditor';
import { iconFor } from '@ag-website-shared/components/theme-builder/icons';
import { useCollapsibleSections } from '@ag-website-shared/components/theme-builder/useCollapsibleSections';
import styled from '@emotion/styled';
import { Fragment } from 'react';

import { InheritedValueNote } from './InheritedValueNote';
import { useSetEditedGroup } from './editedGroup';
import { usePalette } from './paletteModel';
import { type ChartsParamConfig, type ChartsParamRow, GENERAL_GROUP_ID, PARAM_GROUPS } from './params';

const PALETTE_SECTION = 'Palette';
const ALL_PARAMS_SECTION = 'All Parameters';

const DEFAULT_OPEN_SECTIONS = [
    PALETTE_SECTION,
    ...PARAM_GROUPS.filter((group) => group.expanded).map((group) => group.label),
    // A param pinned here was asked for explicitly; a closed section would hide it.
    ALL_PARAMS_SECTION,
];

const paramEditor = (param: ChartsParamConfig) => (
    <ParamEditor
        key={param.key}
        param={param.key}
        label={param.label}
        // Three sections have a "Background Color", so the tooltip carries what
        // the short label leaves out: which part of the chart this one paints.
        showDocs
        note={<InheritedValueNote param={param.key} />}
        icon={iconFor(param.icon)}
        swipeAdjustmentDivisor={param.swipeAdjustmentDivisor}
        min={param.min}
        max={param.max}
    />
);

const paramRow = (row: ChartsParamRow) =>
    Array.isArray(row) ? <LeftBiasRow key={row[0].key}>{row.map(paramEditor)}</LeftBiasRow> : paramEditor(row);

export const EditorPanel = () => {
    const sectionProps = useCollapsibleSections(DEFAULT_OPEN_SECTIONS);
    const [palette, setPalette] = usePalette();
    const setEditedGroup = useSetEditedGroup();

    // See `editedGroup.ts`. Capture handlers, so the panel clears the group and
    // the group under the pointer then names itself; anywhere else in the panel
    // clears it and stops there. No release on blur: colour pickers render in a
    // portal, so a swatch click would read as abandoning the panel.
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
            {/* Every group, and every param in it - including params that follow
                another one, since the panel is where you find out what a theme
                can change. */}
            {PARAM_GROUPS.map((group) => (
                <Fragment key={group.id}>
                    <CollapsibleSection {...sectionProps(group.label)}>
                        <Fields {...holdGroup(group.id)}>{group.params.map(paramRow)}</Fields>
                    </CollapsibleSection>
                    {group.id === GENERAL_GROUP_ID && (
                        <CollapsibleSection {...sectionProps(PALETTE_SECTION)}>
                            <PaletteEditor value={palette} onChange={setPalette} />
                        </CollapsibleSection>
                    )}
                </Fragment>
            ))}
            {/* The same params, searchable, for finding one without knowing
                which section holds it. */}
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

const LeftBiasRow = styled('div')`
    display: flex;
    gap: 12px;
    > :nth-of-type(1) {
        flex: 2;
    }
    > :nth-of-type(2) {
        flex: 1;
    }
`;
