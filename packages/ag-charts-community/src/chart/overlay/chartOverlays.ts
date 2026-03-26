import { BaseProperties, Property } from 'ag-charts-core';

import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import { Overlay } from './overlay';

export class ChartOverlays extends BaseProperties {
    @Property
    darkTheme = false;

    @Property
    readonly loading = new Overlay('ag-charts-loading-overlay', 'overlayLoadingData');

    @Property
    readonly noData = new Overlay('ag-charts-no-data-overlay', 'overlayNoData');

    @Property
    readonly noVisibleSeries = new Overlay('ag-charts-no-visible-series', 'overlayNoVisibleSeries');

    @Property
    readonly unsupportedBrowser = new Overlay('ag-charts-unsupported-browser', 'overlayUnsupportedBrowser');

    getFocusInfo(localeManager: LocaleManager): { text: string; rect: BBox } | undefined {
        for (const overlay of [this.loading, this.noData, this.noVisibleSeries, this.unsupportedBrowser]) {
            if (overlay.focusBox !== undefined) {
                return { text: overlay.getText(localeManager), rect: overlay.focusBox };
            }
        }
        return undefined;
    }

    public destroy() {
        this.loading.removeElement();
        this.noData.removeElement();
        this.noVisibleSeries.removeElement();
        this.unsupportedBrowser.removeElement();
    }
}
