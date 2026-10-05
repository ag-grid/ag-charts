import type { NormalisedChartOverlaysOptions } from 'ag-charts-core';

import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import { Overlay } from './overlay';

export class ChartOverlays {
    readonly loading: Overlay;
    readonly noData = new Overlay('ag-charts-no-data-overlay', 'overlayNoData');
    readonly noVisibleSeries = new Overlay('ag-charts-no-visible-series', 'overlayNoVisibleSeries');
    readonly unsupportedBrowser = new Overlay('ag-charts-unsupported-browser', 'overlayUnsupportedBrowser');
    readonly validation: Overlay;

    constructor(defaultRenderers?: { loading?: Overlay['renderer']; validation?: Overlay['renderer'] }) {
        this.loading = new Overlay('ag-charts-loading-overlay', 'overlayLoadingData', defaultRenderers?.loading);
        this.validation = new Overlay(
            'ag-charts-validation-overlay',
            'overlayValidation',
            defaultRenderers?.validation
        );
    }

    applyOptions(options: NormalisedChartOverlaysOptions) {
        this.loading.applyOptions(options.loading);
        this.noData.applyOptions(options.noData);
        this.noVisibleSeries.applyOptions(options.noVisibleSeries);
        this.unsupportedBrowser.applyOptions(options.unsupportedBrowser);
    }

    getFocusInfo(localeManager: LocaleManager): { text: string; rect: BBox } | undefined {
        for (const overlay of [
            this.validation,
            this.loading,
            this.noData,
            this.noVisibleSeries,
            this.unsupportedBrowser,
        ]) {
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
        this.validation.removeElement();
    }
}
