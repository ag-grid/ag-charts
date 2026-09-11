import { ImportExportButton } from '@ag-website-shared/components/theme-builder/ImportExportButton';
import styled from '@emotion/styled';
import { useMemo } from 'react';

import { validateChartsThemeCode } from './chartsThemeImport';
import { type ChartsThemeSelection, renderChartsThemeCode } from './chartsThemeOutput';

/**
 * The way in and out of the tool, pinned to the foot of the sidebar exactly as
 * grid and Studio pin theirs - and now the same control, which is why the shared
 * dialog takes the code to show and the parser to read it back as props: an AG
 * Charts theme is a plain options object rather than a `withParams` chain, and
 * that is the only part of the dialog that differs.
 */
export const GetThemeButton = ({ selection }: { selection: ChartsThemeSelection }) => {
    const exportCode = useMemo(() => renderChartsThemeCode(selection), [selection]);

    return (
        <ImportExportButton
            allowedPlacements={['right-end']}
            dialogProps={{
                exportCode,
                downloadFileName: 'ag-charts-theme-builder.js',
                validateImport: validateChartsThemeCode,
                importPlaceholder: IMPORT_PLACEHOLDER,
                helpText: <HelpText />,
                // Not the viewport: the builder's root clips its overflow, so the
                // popup's room is the tool's own height. The floating-ui size
                // middleware measures that and publishes it, minus this dialog's
                // share of the popup padding.
                maxHeight: 'calc(var(--popup-available-height, 100vh) - 40px)',
            }}
        />
    );
};

const IMPORT_PLACEHOLDER =
    'Paste your theme code here:\n\nexport const myTheme = {\n    params: { ... },\n    palette: { ... },\n};';

/**
 * Charts' own, rather than the shared link to a Theme Builder docs page: there
 * is no charts one to link to yet, and a paragraph saying what to do with the
 * snippet is more use here than a link that goes nowhere.
 */
const HelpText = () => (
    <Paragraph>
        Pass this theme to the <code>theme</code> option of your chart to apply everything you have chosen here, or
        paste a theme back in to carry on from it.
    </Paragraph>
);

const Paragraph = styled('div')`
    code {
        font-family: var(--text-monospace-font-family);
    }
`;
