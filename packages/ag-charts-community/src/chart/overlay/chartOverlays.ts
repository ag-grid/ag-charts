import { ADD_PHASE } from '../../motion/animation';
import { injectStyle } from '../../util/dom';
import type { AnimationManager } from '../interaction/animationManager';
import { DEFAULT_OVERLAY_CLASS, DEFAULT_OVERLAY_DARK_CLASS, Overlay } from './overlay';

const defaultOverlayCss = `
.${DEFAULT_OVERLAY_CLASS} {
    color: #181d1f;
}

.${DEFAULT_OVERLAY_CLASS}.${DEFAULT_OVERLAY_DARK_CLASS} {
    color: #ffffff;
}
`;

export class ChartOverlays {
    private static overlayDocuments: Document[] = [];

    constructor(parent: HTMLElement, animationManager: AnimationManager) {
        this.loading = new Overlay('ag-chart-loading-overlay', parent, animationManager);
        this.loading.text = 'Loading data...';
        this.loading.renderer = () => this.renderLoadingSpinner(parent, animationManager);

        this.noData = new Overlay('ag-chart-no-data-overlay', parent, animationManager);

        this.noVisibleSeries = new Overlay('ag-chart-no-visible-series', parent, animationManager);
        this.noVisibleSeries.text = 'No visible series';

        if (ChartOverlays.overlayDocuments.indexOf(parent.ownerDocument) < 0) {
            injectStyle(parent.ownerDocument, defaultOverlayCss);
            ChartOverlays.overlayDocuments.push(parent.ownerDocument);
        }
    }

    loading: Overlay;
    noData: Overlay;
    noVisibleSeries: Overlay;

    public destroy() {
        this.loading.hide();
        this.noData.hide();
        this.noVisibleSeries.hide();
    }

    private renderLoadingSpinner(parent: HTMLElement, animationManager: AnimationManager) {
        const container = this.createElement(parent, 'div');
        container.style.alignItems = 'center';
        container.style.boxSizing = 'border-box';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.justifyContent = 'center';
        container.style.margin = '8px';
        container.style.height = '100%';
        container.style.font = '12px Verdana, sans-serif';
        container.style.background = 'rgba(255, 255, 255, 0.5)';
        container.style.animation = `ag-charts-loading ${
            ADD_PHASE.animationDuration * animationManager.defaultDuration
        }ms linear ${ADD_PHASE.animationDelay * animationManager.defaultDuration}ms both`;

        const spinner = this.createElement(container, 'div');
        spinner.style.width = '10px';
        spinner.style.height = '10px';
        spinner.style.borderRadius = '50%';
        spinner.style.borderWidth = '2px';
        spinner.style.borderStyle = 'solid';
        spinner.style.borderColor = 'rgb(0, 0, 0) rgba(0, 0, 0, 0)';
        spinner.style.animation = 'ag-charts-loading-spinner 1s infinite';

        const label = this.createElement(container, 'div');
        label.style.marginTop = '1em';
        label.innerText = this.loading.text ?? 'Loading data...';

        const animationStyles = this.createElement(container, 'style');
        animationStyles.innerText = [
            '@keyframes ag-charts-loading { from { opacity: 0 } to { opacity: 1 } }',
            '@keyframes ag-charts-loading-spinner { to { transform: rotate(0.5turn); } }',
        ].join('');

        container.replaceChildren(animationStyles, spinner, label);

        return container.outerHTML;
    }

    protected createElement(parent: HTMLElement, tagName: string, options?: ElementCreationOptions) {
        return parent.ownerDocument.createElement(tagName, options);
    }
}
