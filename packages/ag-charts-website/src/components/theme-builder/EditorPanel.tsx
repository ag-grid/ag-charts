import { AdvancedParamSelector } from '@ag-website-shared/components/theme-builder/AdvancedParamSelector';
import { CollapsibleSection } from '@ag-website-shared/components/theme-builder/CollapsibleSection';
import { PaletteEditor } from '@ag-website-shared/components/theme-builder/PaletteEditor';
import { ParamEditor } from '@ag-website-shared/components/theme-builder/ParamEditor';
import { iconFor } from '@ag-website-shared/components/theme-builder/icons';
import { useCollapsibleSections } from '@ag-website-shared/components/theme-builder/useCollapsibleSections';
import { enabledAdvancedParamsAtom } from '@ag-website-shared/theming/advanced-params';
import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';

import { InheritedValueNote } from './InheritedValueNote';
import { usePalette } from './paletteModel';
import {
    ALL_PARAMS_SECTION,
    type ChartsParamConfig,
    type ChartsParamEntry,
    type ChartsParamGroup,
    PALETTE_SECTION,
    PARAM_GROUPS,
    defaultOpenSections,
} from './params';

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

const paramEntry = (entry: ChartsParamEntry) =>
    Array.isArray(entry) ? <Row key={entry[0].key}>{entry.map(paramEditor)}</Row> : paramEditor(entry);

const [GENERAL_GROUP, ...OTHER_GROUPS] = PARAM_GROUPS;

export const EditorPanel = () => {
    const hasPinnedParams = useAtomValue(enabledAdvancedParamsAtom).size > 0;
    const sectionProps = useCollapsibleSections(defaultOpenSections(hasPinnedParams));
    const [palette, setPalette] = usePalette();

    const groupSection = (group: ChartsParamGroup) => (
        <CollapsibleSection key={group.id} {...sectionProps(group.label)}>
            <Fields>{group.params.map(paramEntry)}</Fields>
        </CollapsibleSection>
    );

    return (
        <PanelWrapper>
            {groupSection(GENERAL_GROUP)}
            <CollapsibleSection {...sectionProps(PALETTE_SECTION)}>
                <PaletteEditor value={palette} onChange={setPalette} />
            </CollapsibleSection>
            {OTHER_GROUPS.map(groupSection)}
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

const Row = styled('div')`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    > * {
        min-width: 0;
    }
`;
