import type { ImportType } from '@ag-grid-types';
import { replaceHistoryUrl } from '@ag-website-shared/utils/historyUrl';

export const updateSearchParams = ({
    integratedCharts,
    importType,
}: {
    integratedCharts: boolean;
    importType: ImportType;
}) => {
    const url = new URL(window.location);
    const integratedChartsParamValue = url.searchParams.get('integratedCharts') === 'true';
    const importTypeParam = url.searchParams.get('importType');

    if (integratedChartsParamValue !== integratedCharts) {
        if (integratedCharts) {
            url.searchParams.set('integratedCharts', 'true');
        } else {
            url.searchParams.delete('integratedCharts');
        }
    }

    if (importTypeParam !== importType) {
        if (importType) {
            url.searchParams.set('importType', importType);
        } else {
            url.searchParams.delete('importType');
        }
    }

    // A filter, not a navigation: no page-level popstate handler services these entries, so
    // pushing one leaves back moving the URL with nothing reacting to it.
    replaceHistoryUrl(url);
};
