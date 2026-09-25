import type { LocaleManager } from '../../locale/localeManager';
import type { BBox } from '../../scene/bbox';
import { type NormalisedChartOverlayOptions, Overlay } from './overlay';

export type NormalisedChartOverlaysOptions = {
    darkTheme?: boolean;
    loading?: NormalisedChartOverlayOptions;
    noData?: NormalisedChartOverlayOptions;
    noVisibleSeries?: NormalisedChartOverlayOptions;
    unsupportedBrowser?: NormalisedChartOverlayOptions;
};

export class ChartOverlays {
    darkTheme = false;

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
        this.darkTheme = options.darkTheme ?? false;
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
