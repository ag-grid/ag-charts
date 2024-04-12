import { BaseProperties } from '../../util/properties';
import { OBJECT, Validate } from '../../util/validation';
import { Overlay } from './overlay';

export class ChartOverlays extends BaseProperties {
    @Validate(OBJECT)
    readonly loading = new Overlay('ag-chart-loading-overlay', 'Loading data...');

    @Validate(OBJECT)
    readonly noData = new Overlay('ag-chart-no-data-overlay', 'No data to display');

    @Validate(OBJECT)
    readonly noVisibleSeries = new Overlay('ag-chart-no-visible-series', 'No visible series');

    getFocusInfo(): { text: string; rect: { x: number; y: number; width: number; height: number } } | undefined {
        for (const overlay of [this.loading, this.noData, this.noVisibleSeries]) {
            const rect = overlay.getBoundingRect();
            if (rect !== undefined) {
                const { text = '' } = overlay;
                return { text, rect };
            }
        }
        return undefined;
    }

    public destroy() {
        this.loading.removeElement();
        this.noData.removeElement();
        this.noVisibleSeries.removeElement();
    }
}
